import {
  getUserById,
  updateUserProfile as updateUserProfileRecord,
  saveUserAvatar,
  getUserPasswordHash,
  saveUserPasswordHash,
  softDeleteUser,
} from "../repositories/userRepository.js";
import { randomUUID } from "node:crypto";
import {
  getUserNotifications,
  deleteUserNotifications,
} from "../repositories/userSettingsRepository.js";
import { compare as comparePassword, hash as hashPassword } from "bcryptjs";

export type UserProfile = {
  id: string;
  role: "user";
  name: string;
  avatar: string;
  bio: string | null;
  gender: string | null;
  birthday: string | null;
  balance: number;
  notifications: Record<string, boolean>;
};

export type UserProfileUpdateInput = {
  name?: string;
  bio?: string | null;
};

export type UserProfileUpdateResult = {
  id: string;
  name: string;
  bio: string | null;
};

const CDN_BASE_URL = "https://cdn.otomohan.local/avatars";

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const notifications = (await getUserNotifications(userId)) ?? {
    incomingCall: true,
    callSummary: true,
    walletAlert: true,
    marketing: false,
  };

  return {
    id: user.id,
    role: "user",
    name: user.name,
    avatar: user.avatar_url,
    bio: user.bio,
    gender: user.gender,
    birthday: user.birthday,
    balance: user.balance,
    notifications,
  };
}

export async function updateUserProfile(
  userId: string,
  payload: UserProfileUpdateInput
): Promise<UserProfileUpdateResult | null> {
  const updated = await updateUserProfileRecord(userId, payload);
  if (!updated) {
    return null;
  }
  return updated;
}

export type AvatarUploadPayload = {
  mimetype: string;
  buffer: Buffer;
  assetKey: string;
};

export async function updateUserAvatar(
  userId: string,
  payload: AvatarUploadPayload
): Promise<{ avatar: string } | null> {
  const fileName = payload.assetKey || `${userId}/${randomUUID()}.webp`;
  const avatarUrl = `${CDN_BASE_URL}/${fileName}`;
  const result = await saveUserAvatar(userId, avatarUrl);
  if (!result) {
    return null;
  }
  return { avatar: result.avatar_url };
}

export type PasswordChangeResult =
  | { success: true }
  | {
      success: false;
      reason: "USER_NOT_FOUND" | "INVALID_CURRENT_PASSWORD" | "UPDATE_FAILED";
    };

const PASSWORD_SALT_ROUNDS = 10;

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<PasswordChangeResult> {
  const storedHash = await getUserPasswordHash(userId);
  if (!storedHash) {
    return { success: false, reason: "USER_NOT_FOUND" };
  }

  const isCurrentValid = await comparePassword(currentPassword, storedHash);
  if (!isCurrentValid) {
    return { success: false, reason: "INVALID_CURRENT_PASSWORD" };
  }

  const newHash = await hashPassword(newPassword, PASSWORD_SALT_ROUNDS);
  const updated = await saveUserPasswordHash(userId, newHash);
  if (!updated) {
    return { success: false, reason: "UPDATE_FAILED" };
  }

  return { success: true };
}

export type DeleteUserAccountResult =
  | { success: true; alreadyDeleted: boolean }
  | { success: false; reason: "USER_NOT_FOUND" | "DELETE_FAILED" };

export async function deleteUserAccount(
  userId: string
): Promise<DeleteUserAccountResult> {
  const status = await softDeleteUser(userId);
  if (status === "not_found") {
    return { success: false, reason: "USER_NOT_FOUND" };
  }

  const notificationsDeleted = await deleteUserNotifications(userId)
    .then(() => true)
    .catch(() => false);

  if (!notificationsDeleted) {
    return { success: false, reason: "DELETE_FAILED" };
  }

  return { success: true, alreadyDeleted: status === "already_deleted" };
}
