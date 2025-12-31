import { fetchWalletByUserId } from "../db/index.js";

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
