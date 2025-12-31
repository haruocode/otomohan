import { fetchUserNotifications } from "../db/index.js";

export type UserNotificationSettings = {
  incomingCall: boolean;
  callSummary: boolean;
  walletAlert: boolean;
  marketing: boolean;
};

export async function getUserNotifications(
  userId: string
): Promise<UserNotificationSettings | null> {
  return fetchUserNotifications(userId);
}
