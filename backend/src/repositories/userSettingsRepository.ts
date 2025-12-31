import {
  fetchUserNotifications,
  deleteUserSettingsRecord,
  saveUserNotificationsRecord,
} from "../db/index.js";

export type UserNotificationSettings = {
  incomingCall: boolean;
  callSummary: boolean;
  walletAlert: boolean;
  marketing: boolean;
};

const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  incomingCall: true,
  callSummary: true,
  walletAlert: true,
  marketing: false,
};

export function getDefaultNotificationSettings(): UserNotificationSettings {
  return { ...DEFAULT_NOTIFICATION_SETTINGS };
}

export async function getUserNotifications(
  userId: string
): Promise<UserNotificationSettings | null> {
  return fetchUserNotifications(userId);
}

export async function deleteUserNotifications(userId: string) {
  await deleteUserSettingsRecord(userId);
}

export async function upsertUserNotifications(
  userId: string,
  updates: Partial<UserNotificationSettings>
): Promise<UserNotificationSettings> {
  const current =
    (await getUserNotifications(userId)) ?? getDefaultNotificationSettings();

  const merged: UserNotificationSettings = {
    ...current,
    ...updates,
  };

  return saveUserNotificationsRecord(userId, merged);
}
