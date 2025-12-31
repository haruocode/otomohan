import {
  getUserById,
  updateUserProfile as updateUserProfileRecord,
} from "../repositories/userRepository.js";
import { getUserNotifications } from "../repositories/userSettingsRepository.js";

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
