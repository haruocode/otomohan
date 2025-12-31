import { fetchUserById, updateUserProfileRecord } from "../db/index.js";

export type UserEntity = {
  id: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  gender: string | null;
  birthday: string | null;
  balance: number;
};

export async function getUserById(userId: string): Promise<UserEntity | null> {
  return fetchUserById(userId);
}

export async function updateUserProfile(
  userId: string,
  payload: { name?: string; bio?: string | null }
) {
  return updateUserProfileRecord(userId, payload);
}
