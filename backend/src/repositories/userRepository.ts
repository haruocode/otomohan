import {
  fetchUserById,
  updateUserProfileRecord,
  updateUserAvatarUrl,
  fetchUserPasswordHash,
  updateUserPasswordHash,
  softDeleteUserRecord,
  fetchUserByEmail,
  insertUserRecord,
} from "../db/index.js";

export type UserEntity = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  gender: string | null;
  birthday: string | null;
  balance: number;
};

export async function getUserById(userId: string): Promise<UserEntity | null> {
  return fetchUserById(userId);
}

export async function getUserByEmail(
  email: string
): Promise<UserEntity | null> {
  return fetchUserByEmail(email);
}

export async function createUser(entry: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserEntity> {
  return insertUserRecord(entry);
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

export async function softDeleteUser(
  userId: string
): Promise<"not_found" | "already_deleted" | "success"> {
  return softDeleteUserRecord(userId);
}
