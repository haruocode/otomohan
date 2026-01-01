import {
  addPointsToWallet,
  getWalletByUserId,
  hasProcessedPayment,
  logWalletCharge,
  listWalletHistoryForUser,
  listWalletUsageForUser,
  type WalletHistoryEntry,
  type WalletUsageEntry,
} from "../repositories/walletRepository.js";
import {
  getActiveWalletPlans,
  getWalletPlanById,
} from "../repositories/walletPlanRepository.js";

export type WalletBalancePayload = {
  userId: string;
  balance: number;
  updatedAt: string;
};

export type WalletChargeInput = {
  planId: string;
  paymentId: string;
  amount: number;
};

export type WalletChargeResult =
  | {
      success: true;
      wallet: WalletBalancePayload;
      chargedPoints: number;
      planId: string;
      paymentId: string;
    }
  | {
      success: false;
      reason: "PLAN_NOT_FOUND" | "INVALID_AMOUNT" | "PAYMENT_ALREADY_PROCESSED";
      expectedAmount?: number;
    };

export type WalletHistoryQuery = {
  limit?: number;
  offset?: number;
  sort?: "newest" | "oldest";
};

export type WalletHistoryResponse = {
  items: WalletHistoryEntry[];
  total: number;
};

export type WalletUsageQuery = {
  limit?: number;
  offset?: number;
  sort?: "newest" | "oldest";
  otomoId?: string;
};

export type WalletUsageResponse = {
  items: WalletUsageEntry[];
  total: number;
};

export async function getWalletBalance(
  userId: string
): Promise<WalletBalancePayload | null> {
  const wallet = await getWalletByUserId(userId);
  if (!wallet) {
    return null;
  }
  return wallet;
}

export async function listWalletPlans() {
  return getActiveWalletPlans();
}

export async function chargeWallet(
  userId: string,
  payload: WalletChargeInput
): Promise<WalletChargeResult> {
  const plan = await getWalletPlanById(payload.planId);
  if (!plan) {
    return { success: false, reason: "PLAN_NOT_FOUND" };
  }

  if (payload.amount !== plan.price) {
    return {
      success: false,
      reason: "INVALID_AMOUNT",
      expectedAmount: plan.price,
    };
  }

  const alreadyProcessed = await hasProcessedPayment(payload.paymentId);
  if (alreadyProcessed) {
    return { success: false, reason: "PAYMENT_ALREADY_PROCESSED" };
  }

  const chargedPoints = plan.points + plan.bonusPoints;
  const wallet = await addPointsToWallet(userId, chargedPoints);

  await logWalletCharge({
    userId,
    planId: plan.planId,
    paymentId: payload.paymentId,
    amount: payload.amount,
    points: plan.points,
    bonusPoints: plan.bonusPoints,
  });

  return {
    success: true,
    wallet,
    chargedPoints,
    planId: plan.planId,
    paymentId: payload.paymentId,
  };
}

export async function listWalletPurchaseHistory(
  userId: string,
  query: WalletHistoryQuery
): Promise<WalletHistoryResponse> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const offset = Math.max(query.offset ?? 0, 0);
  const sort: "newest" | "oldest" =
    query.sort === "oldest" ? "oldest" : "newest";

  return listWalletHistoryForUser({
    userId,
    limit,
    offset,
    sort,
  });
}

export async function listWalletUsage(
  userId: string,
  query: WalletUsageQuery
): Promise<WalletUsageResponse> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const offset = Math.max(query.offset ?? 0, 0);
  const sort: "newest" | "oldest" =
    query.sort === "oldest" ? "oldest" : "newest";
  const otomoId =
    typeof query.otomoId === "string" && query.otomoId.trim().length
      ? query.otomoId.trim()
      : undefined;

  return listWalletUsageForUser({
    userId,
    limit,
    offset,
    sort,
    otomoId,
  });
}
