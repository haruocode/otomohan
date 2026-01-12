import {
  CommunicationIdentityClient,
  CommunicationUserToken,
} from "@azure/communication-identity";

/**
 * Azure Communication Services 用のトークンサービス
 * ユーザーに対してACSアクセストークンを発行する
 */

// 環境変数からACS接続文字列を取得
const connectionString = process.env.ACS_CONNECTION_STRING;

let identityClient: CommunicationIdentityClient | null = null;

function getIdentityClient(): CommunicationIdentityClient {
  if (!connectionString) {
    throw new Error(
      "ACS_CONNECTION_STRING environment variable is not set. " +
        "Please set it in your .env file."
    );
  }

  if (!identityClient) {
    identityClient = new CommunicationIdentityClient(connectionString);
  }

  return identityClient;
}

export interface AcsTokenResponse {
  /** ACSユーザーID */
  acsUserId: string;
  /** アクセストークン */
  token: string;
  /** トークン有効期限（ISO 8601形式） */
  expiresOn: string;
}

/**
 * 新規ACSユーザーを作成し、VoIPスコープのトークンを発行
 */
export async function createUserAndToken(): Promise<AcsTokenResponse> {
  const client = getIdentityClient();

  const userAndToken: CommunicationUserToken = await client.createUserAndToken([
    "voip",
  ]);

  return {
    acsUserId: userAndToken.user.communicationUserId,
    token: userAndToken.token,
    expiresOn: userAndToken.expiresOn.toISOString(),
  };
}

/**
 * 既存ACSユーザーのトークンを更新
 * @param acsUserId ACSユーザーID
 */
export async function refreshToken(
  acsUserId: string
): Promise<AcsTokenResponse> {
  const client = getIdentityClient();

  const tokenResponse = await client.getToken(
    { communicationUserId: acsUserId },
    ["voip"]
  );

  return {
    acsUserId,
    token: tokenResponse.token,
    expiresOn: tokenResponse.expiresOn.toISOString(),
  };
}

/**
 * ACSユーザーを削除（通話終了後のクリーンアップ用）
 * @param acsUserId ACSユーザーID
 */
export async function revokeTokensAndDeleteUser(
  acsUserId: string
): Promise<void> {
  const client = getIdentityClient();

  // トークンを無効化
  await client.revokeTokens({ communicationUserId: acsUserId });

  // ユーザーを削除
  await client.deleteUser({ communicationUserId: acsUserId });
}

/**
 * 通話参加者用のACSトークンを取得
 * 既存のACSユーザーIDがあればトークン更新、なければ新規作成
 * @param existingAcsUserId 既存のACSユーザーID（オプション）
 */
export async function getCallToken(
  existingAcsUserId?: string
): Promise<AcsTokenResponse> {
  if (existingAcsUserId) {
    try {
      return await refreshToken(existingAcsUserId);
    } catch {
      // トークン更新に失敗した場合は新規作成
      console.warn(
        `Failed to refresh token for ${existingAcsUserId}, creating new user`
      );
    }
  }

  return createUserAndToken();
}
