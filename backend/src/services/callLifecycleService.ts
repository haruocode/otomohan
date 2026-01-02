import {
  getCallById,
  finalizeCallSession,
  type CallEndReason,
} from "../repositories/callRepository.js";
import {
  findOtomoById,
  updateOtomoStatus,
} from "../repositories/otomoRepository.js";
import { broadcastToUsers } from "../ws/connectionRegistry.js";
import { broadcastOtomoStatusFromSnapshot } from "./otomoStatusService.js";

export type CallEndResult =
  | {
      success: true;
      callId: string;
      alreadyEnded: boolean;
      payload?: {
        callId: string;
        userId: string;
        otomoId: string;
        endedAt: string;
        reason: CallEndReason;
        durationSeconds: number;
        totalChargedPoints: number;
      };
    }
  | { success: false; reason: "CALL_NOT_FOUND" | "OTOMO_NOT_FOUND" };

export async function finalizeCallSessionAndBroadcast(options: {
  callId: string;
  reason: CallEndReason;
  endedAt?: string;
  durationSeconds?: number;
  totalChargedPoints?: number;
}): Promise<CallEndResult> {
  const call = await getCallById(options.callId);
  if (!call) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  if (call.status === "ended") {
    return { success: true, callId: call.callId, alreadyEnded: true };
  }

  const endedAt = options.endedAt ?? new Date().toISOString();
  const durationSeconds =
    options.durationSeconds ??
    computeDurationSeconds(call.connectedAt ?? call.startedAt, endedAt);

  const otomo = await findOtomoById(call.otomoId);
  if (!otomo) {
    return { success: false, reason: "OTOMO_NOT_FOUND" };
  }

  const finalizePayload: {
    callId: string;
    endedAt: string;
    durationSeconds: number;
    endReason: CallEndReason;
    billedUnits?: number;
    billedPoints?: number;
  } = {
    callId: call.callId,
    endedAt,
    durationSeconds,
    endReason: options.reason,
  };

  if (typeof options.totalChargedPoints === "number") {
    finalizePayload.billedPoints = options.totalChargedPoints;
  }

  const finalized = await finalizeCallSession(finalizePayload);

  if (!finalized) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  const updatedStatus = await updateOtomoStatus(otomo.otomoId, {
    isOnline: true,
    isAvailable: true,
    statusMessage: "通話終了",
    statusUpdatedAt: endedAt,
  });

  if (updatedStatus) {
    broadcastOtomoStatusFromSnapshot({
      otomoId: otomo.otomoId,
      snapshot: updatedStatus,
    });
  }

  const payload = {
    callId: finalized.callId,
    userId: finalized.userId,
    otomoId: finalized.otomoId,
    endedAt,
    reason: options.reason,
    durationSeconds,
    totalChargedPoints: finalized.billedPoints,
  } as const;

  broadcastToUsers([finalized.userId, otomo.ownerUserId], {
    type: "call_end",
    payload,
  });

  return {
    success: true,
    callId: finalized.callId,
    alreadyEnded: false,
    payload,
  };
}

function computeDurationSeconds(start: string | null, endedAt: string) {
  const started = start ? Date.parse(start) : NaN;
  const ended = Date.parse(endedAt);
  if (Number.isNaN(ended)) {
    return 0;
  }
  if (Number.isNaN(started)) {
    return 0;
  }
  return Math.max(0, Math.round((ended - started) / 1000));
}

export type { CallEndReason };
