import {
  fetchUserById,
  updateUserProfileRecord,
  updateUserAvatarUrl,
  fetchUserPasswordHash,
  updateUserPasswordHash,
} from "../db/index.js";

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

export async function saveUserAvatar(
  userId: string,
  avatarUrl: string
): Promise<{ id: string; avatar_url: string } | null> {
  return updateUserAvatarUrl(userId, avatarUrl);
}

export async function getUserPasswordHash(
  userId: string
): Promise<string | null> {
  return fetchUserPasswordHash(userId);
}

export async function saveUserPasswordHash(
  userId: string,
  hash: string
): Promise<boolean> {
  return updateUserPasswordHash(userId, hash);
}
