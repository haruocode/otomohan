import { broadcastToUser } from "../ws/connectionRegistry.js";

export type WalletUpdateReason = "call_tick" | "charge" | "adjustment";

type WalletUpdateTimestamp = number | string | Date | undefined;

export function broadcastWalletUpdate(options: {
  userId: string;
  balance: number;
  reason: WalletUpdateReason;
  timestamp?: WalletUpdateTimestamp;
}) {
  const timestamp = getEpochSeconds(options.timestamp);

  broadcastToUser(options.userId, {
    type: "wallet_update",
    balance: options.balance,
    reason: options.reason,
    timestamp,
  });
}

function getEpochSeconds(source: WalletUpdateTimestamp): number {
  if (typeof source === "number" && Number.isFinite(source)) {
    return Math.floor(source);
  }

  if (typeof source === "string") {
    const parsed = Date.parse(source);
    if (!Number.isNaN(parsed)) {
      return Math.floor(parsed / 1000);
    }
  }

  if (source instanceof Date && !Number.isNaN(source.getTime())) {
    return Math.floor(source.getTime() / 1000);
  }

  return Math.floor(Date.now() / 1000);
}
