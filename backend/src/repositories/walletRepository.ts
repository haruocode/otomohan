import {
  fetchWalletByUserId,
  incrementWalletBalanceRecord,
  insertWalletHistoryRecord,
  isPaymentAlreadyProcessed,
  fetchWalletHistoryForUser,
  fetchWalletUsageForUser,
} from "../db/index.js";

export type WalletSnapshot = {
  userId: string;
  balance: number;
  updatedAt: string;
};

export async function getWalletByUserId(
  userId: string
): Promise<WalletSnapshot | null> {
  return fetchWalletByUserId(userId);
}

export async function addPointsToWallet(userId: string, points: number) {
  return incrementWalletBalanceRecord(userId, points);
}

export async function adjustWalletBalance(userId: string, deltaPoints: number) {
  return incrementWalletBalanceRecord(userId, deltaPoints);
}

export async function hasProcessedPayment(paymentId: string) {
  return isPaymentAlreadyProcessed(paymentId);
}

export async function logWalletCharge(entry: {
  userId: string;
  planId: string;
  paymentId: string;
  amount: number;
  points: number;
  bonusPoints: number;
}) {
  return insertWalletHistoryRecord(entry);
}

export type WalletHistoryEntry = {
  historyId: string;
  planId: string;
  planTitle: string;
  amount: number;
  points: number;
  bonusPoints: number;
  paymentId: string;
  createdAt: string;
};

export async function listWalletHistoryForUser(options: {
  userId: string;
  limit: number;
  offset: number;
  sort: "newest" | "oldest";
}): Promise<{ items: WalletHistoryEntry[]; total: number }> {
  return fetchWalletHistoryForUser(options);
}

export type WalletUsageEntry = {
  usageId: string;
  callId: string;
  otomoId: string;
  otomoName: string;
  usedPoints: number;
  durationMinutes: number;
  createdAt: string;
};

export async function listWalletUsageForUser(options: {
  userId: string;
  limit: number;
  offset: number;
  sort: "newest" | "oldest";
  otomoId?: string;
}): Promise<{ items: WalletUsageEntry[]; total: number }> {
  return fetchWalletUsageForUser(options);
}
