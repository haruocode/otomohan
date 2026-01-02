import { broadcastToUsers } from "../ws/connectionRegistry.js";
import { getCallById } from "../repositories/callRepository.js";
import { processBillingTick } from "./callBillingService.js";

const BILLING_INTERVAL_MS = 60_000;
const RTP_TIMEOUT_MS = 15_000;

type TimerState = {
  callId: string;
  userId: string;
  otomoId: string;
  otomoOwnerUserId: string;
  pricePerMinute: number;
  connectedAt: string;
  tickNumber: number;
  totalChargedPoints: number;
  lastHeartbeatMs: number;
  intervalHandle: NodeJS.Timeout;
  processing: boolean;
};

const activeTimers = new Map<string, TimerState>();

export function startCallBillingTimer(options: {
  callId: string;
  userId: string;
  otomoId: string;
  otomoOwnerUserId: string;
  pricePerMinute: number;
  connectedAt: string;
}) {
  const existing = activeTimers.get(options.callId);
  if (existing) {
    existing.pricePerMinute = options.pricePerMinute;
    existing.connectedAt = options.connectedAt;
    registerRtpHeartbeat(options.callId, options.connectedAt);
    return;
  }

  const state: TimerState = {
    ...options,
    tickNumber: 0,
    totalChargedPoints: 0,
    lastHeartbeatMs: Date.now(),
    intervalHandle: setInterval(() => {
      void processTimerTick(options.callId);
    }, BILLING_INTERVAL_MS),
    processing: false,
  };

  activeTimers.set(options.callId, state);
  registerRtpHeartbeat(options.callId, options.connectedAt);
}

export function stopCallBillingTimer(callId: string, reason?: string) {
  const state = activeTimers.get(callId);
  if (!state) {
    return;
  }
  clearInterval(state.intervalHandle);
  activeTimers.delete(callId);
  if (reason) {
    console.info(`[callBillingTimer] stopped ${callId}: ${reason}`);
  }
}

export function registerRtpHeartbeat(callId: string, timestamp?: string) {
  const state = activeTimers.get(callId);
  if (!state) {
    return false;
  }
  if (typeof timestamp === "string") {
    const parsed = Date.parse(timestamp);
    state.lastHeartbeatMs = Number.isNaN(parsed) ? Date.now() : parsed;
  } else {
    state.lastHeartbeatMs = Date.now();
  }
  return true;
}

export function isBillingTimerActive(callId: string) {
  return activeTimers.has(callId);
}

async function processTimerTick(callId: string) {
  const state = activeTimers.get(callId);
  if (!state || state.processing) {
    return;
  }

  if (!isRtpAlive(state)) {
    stopCallBillingTimer(callId, "rtp_timeout");
    return;
  }

  state.processing = true;
  try {
    const call = await getCallById(callId);
    if (!call || call.status === "ended" || call.status === "rejected") {
      stopCallBillingTimer(callId, "call_inactive");
      return;
    }

    state.tickNumber += 1;
    const tickResult = await processBillingTick({
      callId: state.callId,
      userId: state.userId,
      tickNumber: state.tickNumber,
      pricePerMinute: state.pricePerMinute,
      connectedAt: state.connectedAt,
    });

    if (!tickResult.success) {
      stopCallBillingTimer(callId, tickResult.reason);
      return;
    }

    state.totalChargedPoints = tickResult.totalChargedPoints;

    broadcastToUsers([state.userId, state.otomoOwnerUserId], {
      type: "call_tick",
      payload: {
        callId: tickResult.callId,
        tickNumber: tickResult.tickNumber,
        chargedPoints: tickResult.chargedPoints,
        totalChargedPoints: tickResult.totalChargedPoints,
        durationSeconds: tickResult.durationSeconds,
        userBalance: tickResult.userBalance,
        timestamp: tickResult.timestamp,
        status: tickResult.status,
      },
    });

    if (tickResult.status === "ended") {
      stopCallBillingTimer(callId, "balance_depleted");
    }
  } catch (error) {
    console.error(`[callBillingTimer] tick failed for ${callId}`, error);
    stopCallBillingTimer(callId, "error");
  } finally {
    state.processing = false;
  }
}

function isRtpAlive(state: TimerState) {
  return Date.now() - state.lastHeartbeatMs <= RTP_TIMEOUT_MS;
}
