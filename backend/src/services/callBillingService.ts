import {
  getCallById,
  recordCallBillingUnit,
  updateCallBillingProgress,
} from "../repositories/callRepository.js";
import {
  adjustWalletBalance,
  getWalletByUserId,
} from "../repositories/walletRepository.js";

export type BillingTickStatus = "ok" | "low_balance" | "ended";

export type BillingTickResult =
  | {
      success: true;
      callId: string;
      tickNumber: number;
      chargedPoints: number;
      totalChargedPoints: number;
      durationSeconds: number;
      userBalance: number;
      timestamp: string;
      status: BillingTickStatus;
    }
  | { success: false; reason: "CALL_NOT_FOUND" | "INVALID_STATE" };

export async function processBillingTick(options: {
  callId: string;
  userId: string;
  tickNumber: number;
  pricePerMinute: number;
  connectedAt: string;
  timestamp?: string;
}): Promise<BillingTickResult> {
  const call = await getCallById(options.callId);
  if (!call) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  if (call.status === "ended" || call.status === "rejected") {
    return { success: false, reason: "INVALID_STATE" };
  }

  const tickTimestamp = options.timestamp ?? new Date().toISOString();
  const connectedAt = call.connectedAt ?? options.connectedAt;
  const connectedDate = new Date(connectedAt ?? tickTimestamp);
  const nowDate = new Date(tickTimestamp);
  const durationSeconds = Math.max(
    options.tickNumber * 60,
    Math.max(
      0,
      Math.round((nowDate.getTime() - connectedDate.getTime()) / 1000)
    )
  );

  const wallet = await getWalletByUserId(options.userId);
  const balanceBefore = wallet?.balance ?? 0;

  const { chargedPoints, status } = determineCharge(
    balanceBefore,
    options.pricePerMinute
  );

  if (chargedPoints > 0) {
    await adjustWalletBalance(options.userId, -chargedPoints);
  }

  const updatedWallet = await getWalletByUserId(options.userId);
  const userBalance = updatedWallet?.balance ?? 0;

  await recordCallBillingUnit({
    callId: options.callId,
    minuteIndex: Math.max(0, options.tickNumber - 1),
    chargedPoints,
    timestamp: tickTimestamp,
  });

  const updatedCall = await updateCallBillingProgress({
    callId: options.callId,
    billedUnits: options.tickNumber,
    billedPointsDelta: chargedPoints,
    durationSeconds,
    endedAt: tickTimestamp,
  });

  const totalChargedPoints = updatedCall?.billedPoints ?? call.billedPoints;

  return {
    success: true,
    callId: options.callId,
    tickNumber: options.tickNumber,
    chargedPoints,
    totalChargedPoints,
    durationSeconds,
    userBalance,
    timestamp: tickTimestamp,
    status,
  };
}

function determineCharge(
  balance: number,
  pricePerMinute: number
): {
  chargedPoints: number;
  status: BillingTickStatus;
} {
  if (balance >= pricePerMinute) {
    const remaining = balance - pricePerMinute;
    return {
      chargedPoints: pricePerMinute,
      status:
        remaining < pricePerMinute && remaining > 0 ? "low_balance" : "ok",
    };
  }

  if (balance > 0) {
    return {
      chargedPoints: balance,
      status: "ended",
    };
  }

  return {
    chargedPoints: 0,
    status: "ended",
  };
}
