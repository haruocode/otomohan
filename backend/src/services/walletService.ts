import { getWalletByUserId } from "../repositories/walletRepository.js";

export type WalletBalancePayload = {
  userId: string;
  balance: number;
  updatedAt: string;
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
