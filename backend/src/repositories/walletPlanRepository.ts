import { fetchActiveWalletPlans, fetchWalletPlanById } from "../db/index.js";

export type WalletPlan = {
  planId: string;
  title: string;
  price: number;
  points: number;
  bonusPoints: number;
  description: string;
};

function mapPlan(record: {
  planId: string;
  title: string;
  price: number;
  points: number;
  bonusPoints: number;
  description: string;
}) {
  return {
    planId: record.planId,
    title: record.title,
    price: record.price,
    points: record.points,
    bonusPoints: record.bonusPoints,
    description: record.description,
  } satisfies WalletPlan;
}

export async function getActiveWalletPlans(): Promise<WalletPlan[]> {
  const records = await fetchActiveWalletPlans();
  return records.map((record) => mapPlan(record));
}

export async function getWalletPlanById(
  planId: string
): Promise<WalletPlan | null> {
  const record = await fetchWalletPlanById(planId);
  if (!record) {
    return null;
  }
  return mapPlan(record);
}
