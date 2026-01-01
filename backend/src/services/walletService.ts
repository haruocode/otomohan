import {
  addPointsToWallet,
  getWalletByUserId,
  hasProcessedPayment,
  logWalletCharge,
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
