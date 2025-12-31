import { fetchActiveWalletPlans } from "../db/index.js";

export type WalletPlan = {
  planId: string;
  title: string;
  price: number;
  points: number;
  bonusPoints: number;
  description: string;
};

export async function getActiveWalletPlans(): Promise<WalletPlan[]> {
  const records = await fetchActiveWalletPlans();
  return records.map(
    ({ planId, title, price, points, bonusPoints, description }) => ({
      planId,
      title,
      price,
      points,
      bonusPoints,
      description,
    })
  );
}
