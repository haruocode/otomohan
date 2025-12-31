import { getUserNotifications } from "../repositories/userSettingsRepository.js";

export type SettingsPayload = {
  notifications: {
    incomingCall: boolean;
    callSummary: boolean;
    walletAlert: boolean;
    marketing: boolean;
  };
  links: {
    terms: string;
    privacy: string;
  };
  app: {
    version: string;
    minSupportedVersion: string;
  };
};

const DEFAULT_NOTIFICATIONS = {
  incomingCall: true,
  callSummary: true,
  walletAlert: true,
  marketing: false,
} as const;

const TERMS_URL = process.env.TERMS_URL ?? "https://otmhn.app/terms";
const PRIVACY_URL = process.env.PRIVACY_URL ?? "https://otmhn.app/privacy";
const APP_VERSION = process.env.APP_VERSION ?? "1.0.0";
const MIN_APP_VERSION = process.env.MIN_APP_VERSION ?? "1.0.0";

export async function getSettingsForUser(
  userId: string
): Promise<SettingsPayload> {
  const notifications =
    (await getUserNotifications(userId)) ?? DEFAULT_NOTIFICATIONS;

  return {
    notifications,
    links: {
      terms: TERMS_URL,
      privacy: PRIVACY_URL,
    },
    app: {
      version: APP_VERSION,
      minSupportedVersion: MIN_APP_VERSION,
    },
  };
}
