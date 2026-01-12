/**
 * ACSユーザーIDをcallIdごとに保存・管理するインメモリストア
 * 通話参加者同士がACSユーザーIDを共有するために使用
 *
 * 注意: 本番環境ではRedisなどの外部ストレージを推奨
 */

interface AcsUserEntry {
  /** ACSユーザーID */
  acsUserId: string;
  /** アプリ内ユーザーID */
  userId: string;
  /** 登録日時 */
  createdAt: Date;
}

// callId -> userId -> AcsUserEntry
const acsUserStore = new Map<string, Map<string, AcsUserEntry>>();

// 古いエントリを定期的にクリーンアップ（1時間以上前のもの）
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5分ごと
const ENTRY_TTL_MS = 60 * 60 * 1000; // 1時間

setInterval(() => {
  const now = new Date();
  for (const [callId, userMap] of acsUserStore) {
    for (const [userId, entry] of userMap) {
      if (now.getTime() - entry.createdAt.getTime() > ENTRY_TTL_MS) {
        userMap.delete(userId);
      }
    }
    if (userMap.size === 0) {
      acsUserStore.delete(callId);
    }
  }
}, CLEANUP_INTERVAL_MS);

/**
 * ACSユーザーIDを登録
 * @param callId 通話ID
 * @param userId アプリ内ユーザーID
 * @param acsUserId ACSユーザーID
 */
export function registerAcsUser(
  callId: string,
  userId: string,
  acsUserId: string
): void {
  let userMap = acsUserStore.get(callId);
  if (!userMap) {
    userMap = new Map();
    acsUserStore.set(callId, userMap);
  }

  userMap.set(userId, {
    acsUserId,
    userId,
    createdAt: new Date(),
  });
}

/**
 * ACSユーザーIDを取得
 * @param callId 通話ID
 * @param userId アプリ内ユーザーID
 */
export function getAcsUserId(
  callId: string,
  userId: string
): string | undefined {
  const userMap = acsUserStore.get(callId);
  return userMap?.get(userId)?.acsUserId;
}

/**
 * 通話の相手のACSユーザーIDを取得
 * @param callId 通話ID
 * @param myUserId 自分のユーザーID
 */
export function getPartnerAcsUserId(
  callId: string,
  myUserId: string
): string | undefined {
  const userMap = acsUserStore.get(callId);
  if (!userMap) return undefined;

  for (const [userId, entry] of userMap) {
    if (userId !== myUserId) {
      return entry.acsUserId;
    }
  }
  return undefined;
}

/**
 * 通話に関連するすべてのACSユーザーIDを取得
 * @param callId 通話ID
 */
export function getAllAcsUsersForCall(
  callId: string
): Array<{ userId: string; acsUserId: string }> {
  const userMap = acsUserStore.get(callId);
  if (!userMap) return [];

  return Array.from(userMap.values()).map((entry) => ({
    userId: entry.userId,
    acsUserId: entry.acsUserId,
  }));
}

/**
 * 通話のACSユーザー情報をクリア
 * @param callId 通話ID
 */
export function clearAcsUsersForCall(callId: string): void {
  acsUserStore.delete(callId);
}
