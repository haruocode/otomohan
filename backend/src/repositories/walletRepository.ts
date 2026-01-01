import {
  fetchWalletByUserId,
  incrementWalletBalanceRecord,
  insertWalletHistoryRecord,
  isPaymentAlreadyProcessed,
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
