import { randomUUID } from "node:crypto";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  gender: "male" | "female" | "other" | null;
  birthday: string | null;
  balance: number;
  password_hash: string;
  is_deleted: boolean;
  createdAt: string;
};

type OtomoReviewRecord = {
  reviewId: string;
  userDisplayName: string;
  score: number;
  comment: string;
  createdAt: string;
};

type OtomoScheduleRecord = {
  dayOfWeek:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  start: string;
  end: string;
};

type OtomoRecord = {
  otomoId: string;
  ownerUserId: string;
  displayName: string;
  profileImageUrl: string;
  age: number;
  gender: "female" | "male" | "other";
  genres: string[];
  introduction: string;
  tags: string[];
  isOnline: boolean;
  isAvailable: boolean;
  statusMessage: string | null;
  statusUpdatedAt: string;
  pricePerMinute: number;
  rating: number;
  reviewCount: number;
  reviews: OtomoReviewRecord[];
  schedule: OtomoScheduleRecord[];
};

type NotificationSettingsRecord = {
  incomingCall: boolean;
  callSummary: boolean;
  walletAlert: boolean;
  marketing: boolean;
};

type WalletRecord = {
  userId: string;
  balance: number;
  updatedAt: string;
};

type WalletPlanRecord = {
  planId: string;
  title: string;
  price: number;
  points: number;
  bonusPoints: number;
  description: string;
  isActive: boolean;
};

type WalletHistoryRecord = {
  historyId: string;
  userId: string;
  planId: string;
  paymentId: string;
  amount: number;
  points: number;
  bonusPoints: number;
  createdAt: string;
};

type WalletHistoryViewRecord = WalletHistoryRecord & {
  planTitle: string;
};

type WalletUsageRecord = {
  usageId: string;
  userId: string;
  callId: string;
  otomoId: string;
  usedPoints: number;
  durationMinutes: number;
  createdAt: string;
};

type WalletUsageViewRecord = WalletUsageRecord & {
  otomoName: string;
};

export type CallStatus =
  | "requesting"
  | "ringing"
  | "accepted"
  | "active"
  | "failed"
  | "ended";

export const CALL_END_REASON_VALUES = [
  "user_end",
  "otomo_end",
  "no_point",
  "network_lost",
  "timeout",
  "system_error",
] as const;

export type CallEndReason = (typeof CALL_END_REASON_VALUES)[number];

type CallRecord = {
  callId: string;
  userId: string;
  otomoId: string;
  startedAt: string;
  endedAt: string;
  connectedAt: string | null;
  durationSeconds: number;
  billedUnits: number;
  billedPoints: number;
  status: CallStatus;
  endReason: CallEndReason | null;
};

type CallBillingUnitRecord = {
  unitId: string;
  callId: string;
  minuteIndex: number;
  chargedPoints: number;
  timestamp: string;
};

type RefreshTokenRecord = {
  token: string;
  userId: string;
  expiresAt: string;
};

export async function upsertRefreshTokenRecord(entry: {
  userId: string;
  token: string;
  expiresAt: string;
}): Promise<RefreshTokenRecord> {
  const { db } = await import("./drizzle.js");
  const { refreshTokens } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  // 既存のトークンを削除
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, entry.userId));

  // 新しいトークンを挿入
  const [token] = await db
    .insert(refreshTokens)
    .values({
      token: entry.token,
      userId: entry.userId,
      expiresAt: new Date(entry.expiresAt),
    })
    .returning({
      token: refreshTokens.token,
      userId: refreshTokens.userId,
      expiresAt: refreshTokens.expiresAt,
    });

  return {
    token: token.token,
    userId: token.userId,
    expiresAt: token.expiresAt.toISOString(),
  };
}

export async function fetchRefreshTokenRecord(
  token: string
): Promise<RefreshTokenRecord | null> {
  const { db } = await import("./drizzle.js");
  const { refreshTokens } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [refreshToken] = await db
    .select({
      token: refreshTokens.token,
      userId: refreshTokens.userId,
      expiresAt: refreshTokens.expiresAt,
    })
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token))
    .limit(1);

  if (!refreshToken) {
    return null;
  }

  return {
    token: refreshToken.token,
    userId: refreshToken.userId,
    expiresAt: refreshToken.expiresAt.toISOString(),
  };
}

export async function fetchUserById(id: string): Promise<UserRecord | null> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar_url: users.avatarUrl,
      bio: users.bio,
      gender: users.gender,
      birthday: users.birthday,
      balance: users.balance,
      password_hash: users.passwordHash,
      is_deleted: users.isDeleted,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user || user.is_deleted) {
    return null;
  }

  return {
    ...user,
    gender: user.gender as "male" | "female" | "other" | null,
    birthday: user.birthday?.toISOString().split("T")[0] ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function fetchUserByEmail(
  email: string
): Promise<UserRecord | null> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq, and } = await import("drizzle-orm");

  const normalized = email.trim().toLowerCase();
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar_url: users.avatarUrl,
      bio: users.bio,
      gender: users.gender,
      birthday: users.birthday,
      balance: users.balance,
      password_hash: users.passwordHash,
      is_deleted: users.isDeleted,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.email, normalized), eq(users.isDeleted, false)))
    .limit(1);

  if (!user) {
    return null;
  }

  return {
    ...user,
    gender: user.gender as "male" | "female" | "other" | null,
    birthday: user.birthday?.toISOString().split("T")[0] ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function insertUserRecord(entry: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");

  const id = randomUUID();
  const [user] = await db
    .insert(users)
    .values({
      id,
      name: entry.name,
      email: entry.email.trim().toLowerCase(),
      passwordHash: entry.passwordHash,
      avatarUrl: null,
      bio: "",
      gender: null,
      birthday: null,
      balance: 0,
      isDeleted: false,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar_url: users.avatarUrl,
      bio: users.bio,
      gender: users.gender,
      birthday: users.birthday,
      balance: users.balance,
      password_hash: users.passwordHash,
      is_deleted: users.isDeleted,
      createdAt: users.createdAt,
    });

  return {
    ...user,
    gender: user.gender as "male" | "female" | "other" | null,
    birthday: user.birthday?.toISOString().split("T")[0] ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function fetchUserNotifications(userId: string) {
  const { db } = await import("./drizzle.js");
  const { userNotificationSettings } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [settings] = await db
    .select({
      incomingCall: userNotificationSettings.incomingCall,
      callSummary: userNotificationSettings.callSummary,
      walletAlert: userNotificationSettings.walletAlert,
      marketing: userNotificationSettings.marketing,
    })
    .from(userNotificationSettings)
    .where(eq(userNotificationSettings.userId, userId))
    .limit(1);

  return settings ?? null;
}

export async function fetchWalletByUserId(
  userId: string
): Promise<WalletRecord | null> {
  const { db } = await import("./drizzle.js");
  const { walletBalances } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [wallet] = await db
    .select({
      userId: walletBalances.userId,
      balance: walletBalances.balance,
      updatedAt: walletBalances.updatedAt,
    })
    .from(walletBalances)
    .where(eq(walletBalances.userId, userId))
    .limit(1);

  if (!wallet) {
    return null;
  }

  return {
    userId: wallet.userId,
    balance: wallet.balance,
    updatedAt: wallet.updatedAt.toISOString(),
  };
}

export async function fetchActiveWalletPlans(): Promise<WalletPlanRecord[]> {
  const { db } = await import("./drizzle.js");
  const { walletPlans } = await import("./schema/index.js");
  const { eq, asc } = await import("drizzle-orm");

  const plans = await db
    .select({
      planId: walletPlans.id,
      title: walletPlans.title,
      price: walletPlans.priceYen,
      points: walletPlans.points,
      bonusPoints: walletPlans.bonusPoints,
      description: walletPlans.description,
      isActive: walletPlans.isActive,
    })
    .from(walletPlans)
    .where(eq(walletPlans.isActive, true))
    .orderBy(asc(walletPlans.priceYen), asc(walletPlans.id));

  return plans.map((plan) => ({
    planId: plan.planId,
    title: plan.title,
    price: plan.price,
    points: plan.points,
    bonusPoints: plan.bonusPoints,
    description: plan.description ?? "",
    isActive: plan.isActive,
  }));
}

export async function fetchWalletPlanById(
  planId: string
): Promise<WalletPlanRecord | null> {
  const { db } = await import("./drizzle.js");
  const { walletPlans } = await import("./schema/index.js");
  const { eq, and } = await import("drizzle-orm");

  const [plan] = await db
    .select({
      planId: walletPlans.id,
      title: walletPlans.title,
      price: walletPlans.priceYen,
      points: walletPlans.points,
      bonusPoints: walletPlans.bonusPoints,
      description: walletPlans.description,
      isActive: walletPlans.isActive,
    })
    .from(walletPlans)
    .where(and(eq(walletPlans.id, planId), eq(walletPlans.isActive, true)))
    .limit(1);

  if (!plan) {
    return null;
  }

  return {
    planId: plan.planId,
    title: plan.title,
    price: plan.price,
    points: plan.points,
    bonusPoints: plan.bonusPoints,
    description: plan.description ?? "",
    isActive: plan.isActive,
  };
}

export async function incrementWalletBalanceRecord(
  userId: string,
  deltaPoints: number
): Promise<WalletRecord> {
  const { db } = await import("./drizzle.js");
  const { walletBalances } = await import("./schema/index.js");
  const { sql } = await import("drizzle-orm");

  // upsert: 存在すれば更新、なければ挿入
  const [wallet] = await db
    .insert(walletBalances)
    .values({
      userId,
      balance: deltaPoints,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: walletBalances.userId,
      set: {
        balance: sql`${walletBalances.balance} + ${deltaPoints}`,
        updatedAt: new Date(),
      },
    })
    .returning({
      userId: walletBalances.userId,
      balance: walletBalances.balance,
      updatedAt: walletBalances.updatedAt,
    });

  return {
    userId: wallet.userId,
    balance: wallet.balance,
    updatedAt: wallet.updatedAt.toISOString(),
  };
}

export async function isPaymentAlreadyProcessed(paymentId: string) {
  const { db } = await import("./drizzle.js");
  const { walletCharges } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [charge] = await db
    .select({ id: walletCharges.id })
    .from(walletCharges)
    .where(eq(walletCharges.paymentId, paymentId))
    .limit(1);

  return !!charge;
}

export async function insertWalletHistoryRecord(entry: {
  userId: string;
  planId: string;
  paymentId: string;
  amount: number;
  points: number;
  bonusPoints: number;
}): Promise<WalletHistoryRecord> {
  const { db } = await import("./drizzle.js");
  const { walletCharges } = await import("./schema/index.js");

  const [charge] = await db
    .insert(walletCharges)
    .values({
      userId: entry.userId,
      planId: entry.planId,
      paymentId: entry.paymentId,
      amountYen: entry.amount,
      grantedPoints: entry.points,
      bonusPoints: entry.bonusPoints,
    })
    .returning({
      historyId: walletCharges.id,
      userId: walletCharges.userId,
      planId: walletCharges.planId,
      paymentId: walletCharges.paymentId,
      amount: walletCharges.amountYen,
      points: walletCharges.grantedPoints,
      bonusPoints: walletCharges.bonusPoints,
      createdAt: walletCharges.createdAt,
    });

  return {
    historyId: charge.historyId,
    userId: charge.userId,
    planId: charge.planId ?? "",
    paymentId: charge.paymentId ?? "",
    amount: charge.amount,
    points: charge.points,
    bonusPoints: charge.bonusPoints,
    createdAt: charge.createdAt.toISOString(),
  };
}

export async function fetchWalletHistoryForUser(options: {
  userId: string;
  limit: number;
  offset: number;
  sort: "newest" | "oldest";
}): Promise<{ items: WalletHistoryViewRecord[]; total: number }> {
  const { db } = await import("./drizzle.js");
  const { walletCharges, walletPlans } = await import("./schema/index.js");
  const { eq, asc, desc, count } = await import("drizzle-orm");

  const { userId, limit, offset, sort } = options;
  const safeOffset = Math.max(offset, 0);
  const safeLimit = Math.max(limit, 0);

  // 総数を取得
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(walletCharges)
    .where(eq(walletCharges.userId, userId));

  // データを取得
  const orderBy =
    sort === "oldest"
      ? asc(walletCharges.createdAt)
      : desc(walletCharges.createdAt);
  const charges = await db
    .select({
      historyId: walletCharges.id,
      userId: walletCharges.userId,
      planId: walletCharges.planId,
      paymentId: walletCharges.paymentId,
      amount: walletCharges.amountYen,
      points: walletCharges.grantedPoints,
      bonusPoints: walletCharges.bonusPoints,
      createdAt: walletCharges.createdAt,
      planTitle: walletPlans.title,
    })
    .from(walletCharges)
    .leftJoin(walletPlans, eq(walletCharges.planId, walletPlans.id))
    .where(eq(walletCharges.userId, userId))
    .orderBy(orderBy)
    .limit(safeLimit)
    .offset(safeOffset);

  const items = charges.map((charge) => ({
    historyId: charge.historyId,
    userId: charge.userId,
    planId: charge.planId ?? "",
    paymentId: charge.paymentId ?? "",
    amount: charge.amount,
    points: charge.points,
    bonusPoints: charge.bonusPoints,
    createdAt: charge.createdAt.toISOString(),
    planTitle: charge.planTitle ?? "不明なプラン",
  }));

  return { items, total };
}

export async function fetchWalletUsageForUser(options: {
  userId: string;
  limit: number;
  offset: number;
  sort: "newest" | "oldest";
  otomoId?: string;
}): Promise<{ items: WalletUsageViewRecord[]; total: number }> {
  const { db } = await import("./drizzle.js");
  const { walletUsages, otomoProfiles } = await import("./schema/index.js");
  const { eq, and, asc, desc, count } = await import("drizzle-orm");

  const { userId, limit, offset, sort, otomoId } = options;
  const safeOffset = Math.max(offset, 0);
  const safeLimit = Math.max(limit, 0);

  // WHERE条件を構築
  const conditions = [eq(walletUsages.userId, userId)];
  if (otomoId) {
    conditions.push(eq(walletUsages.otomoId, otomoId));
  }
  const whereClause =
    conditions.length > 1 ? and(...conditions) : conditions[0];

  // 総数を取得
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(walletUsages)
    .where(whereClause);

  // データを取得
  const orderBy =
    sort === "oldest"
      ? asc(walletUsages.createdAt)
      : desc(walletUsages.createdAt);
  const usages = await db
    .select({
      usageId: walletUsages.id,
      userId: walletUsages.userId,
      callId: walletUsages.callId,
      otomoId: walletUsages.otomoId,
      usedPoints: walletUsages.usedPoints,
      durationMinutes: walletUsages.durationMinutes,
      createdAt: walletUsages.createdAt,
      otomoName: otomoProfiles.displayName,
    })
    .from(walletUsages)
    .leftJoin(otomoProfiles, eq(walletUsages.otomoId, otomoProfiles.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(safeLimit)
    .offset(safeOffset);

  const items = usages.map((usage) => ({
    usageId: usage.usageId,
    userId: usage.userId,
    callId: usage.callId,
    otomoId: usage.otomoId,
    usedPoints: usage.usedPoints,
    durationMinutes: usage.durationMinutes,
    createdAt: usage.createdAt.toISOString(),
    otomoName: usage.otomoName ?? "不明なおとも",
  }));

  return { items, total };
}

export async function fetchCallsForParticipant(options: {
  participantId: string;
  participantType: "user" | "otomo";
  limit: number;
  offset: number;
}): Promise<{ items: CallRecord[]; total: number }> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq, desc, count } = await import("drizzle-orm");

  const safeLimit = Math.max(options.limit, 0);
  const safeOffset = Math.max(options.offset, 0);

  const whereClause =
    options.participantType === "user"
      ? eq(calls.userId, options.participantId)
      : eq(calls.otomoId, options.participantId);

  // 総数を取得
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(calls)
    .where(whereClause);

  // データを取得
  const callRecords = await db
    .select({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    })
    .from(calls)
    .where(whereClause)
    .orderBy(desc(calls.startedAt))
    .limit(safeLimit)
    .offset(safeOffset);

  const items = callRecords.map((call) => ({
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  }));

  return { items, total };
}

export async function fetchCallById(
  callId: string
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [call] = await db
    .select({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    })
    .from(calls)
    .where(eq(calls.id, callId))
    .limit(1);

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function fetchCallBillingUnits(
  callId: string
): Promise<CallBillingUnitRecord[]> {
  const { db } = await import("./drizzle.js");
  const { callBillingUnits } = await import("./schema/index.js");
  const { eq, asc } = await import("drizzle-orm");

  const units = await db
    .select({
      unitId: callBillingUnits.id,
      callId: callBillingUnits.callId,
      minuteIndex: callBillingUnits.minuteIndex,
      chargedPoints: callBillingUnits.chargedPoints,
      timestamp: callBillingUnits.timestamp,
    })
    .from(callBillingUnits)
    .where(eq(callBillingUnits.callId, callId))
    .orderBy(asc(callBillingUnits.minuteIndex));

  return units.map((unit) => ({
    unitId: unit.unitId,
    callId: unit.callId,
    minuteIndex: unit.minuteIndex,
    chargedPoints: unit.chargedPoints,
    timestamp: unit.timestamp.toISOString(),
  }));
}

export async function insertCallBillingUnitRecord(entry: {
  callId: string;
  minuteIndex: number;
  chargedPoints: number;
  timestamp: string;
}): Promise<CallBillingUnitRecord> {
  const { db } = await import("./drizzle.js");
  const { callBillingUnits } = await import("./schema/index.js");

  const [unit] = await db
    .insert(callBillingUnits)
    .values({
      callId: entry.callId,
      minuteIndex: entry.minuteIndex,
      chargedPoints: entry.chargedPoints,
      timestamp: new Date(entry.timestamp),
    })
    .returning({
      unitId: callBillingUnits.id,
      callId: callBillingUnits.callId,
      minuteIndex: callBillingUnits.minuteIndex,
      chargedPoints: callBillingUnits.chargedPoints,
      timestamp: callBillingUnits.timestamp,
    });

  return {
    unitId: unit.unitId,
    callId: unit.callId,
    minuteIndex: unit.minuteIndex,
    chargedPoints: unit.chargedPoints,
    timestamp: unit.timestamp.toISOString(),
  };
}

export async function updateCallBillingProgressRecord(
  callId: string,
  payload: {
    billedUnits: number;
    billedPointsDelta: number;
    durationSeconds: number;
    endedAt: string;
  }
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq, sql } = await import("drizzle-orm");

  const [call] = await db
    .update(calls)
    .set({
      billedUnits: sql`GREATEST(${calls.billedUnits}, ${payload.billedUnits})`,
      billedPoints: sql`${calls.billedPoints} + ${payload.billedPointsDelta}`,
      durationSeconds: sql`GREATEST(${calls.durationSeconds}, ${payload.durationSeconds})`,
      endedAt: new Date(payload.endedAt),
    })
    .where(eq(calls.id, callId))
    .returning({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    });

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function insertCallRequestRecord(entry: {
  callId: string;
  userId: string;
  otomoId: string;
  startedAt?: string;
}): Promise<CallRecord> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");

  const now = entry.startedAt ? new Date(entry.startedAt) : new Date();
  const [call] = await db
    .insert(calls)
    .values({
      id: entry.callId,
      userId: entry.userId,
      otomoId: entry.otomoId,
      startedAt: now,
      endedAt: now,
      connectedAt: null,
      durationSeconds: 0,
      billedUnits: 0,
      billedPoints: 0,
      status: "requesting",
      endReason: null,
    })
    .returning({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    });

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function findActiveCallForParticipant(
  participantId: string
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq, or, and, notInArray } = await import("drizzle-orm");

  const [call] = await db
    .select({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    })
    .from(calls)
    .where(
      and(
        notInArray(calls.status, ["ended", "failed"]),
        or(eq(calls.userId, participantId), eq(calls.otomoId, participantId))
      )
    )
    .limit(1);

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function finalizeCallRecord(
  callId: string,
  payload: {
    endedAt: string;
    durationSeconds: number;
    billedUnits: number;
    billedPoints: number;
  }
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [call] = await db
    .update(calls)
    .set({
      endedAt: new Date(payload.endedAt),
      durationSeconds: payload.durationSeconds,
      billedUnits: payload.billedUnits,
      billedPoints: payload.billedPoints,
      status: "ended",
      endReason: "system_error",
    })
    .where(eq(calls.id, callId))
    .returning({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    });

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function finalizeCallSessionRecord(
  callId: string,
  payload: {
    endedAt: string;
    durationSeconds: number;
    endReason: CallEndReason;
    billedUnits?: number;
    billedPoints?: number;
  }
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const updateData: Record<string, unknown> = {
    endedAt: new Date(payload.endedAt),
    durationSeconds: payload.durationSeconds,
    status: "ended",
    endReason: payload.endReason,
  };

  if (typeof payload.billedUnits === "number") {
    updateData.billedUnits = payload.billedUnits;
  }
  if (typeof payload.billedPoints === "number") {
    updateData.billedPoints = payload.billedPoints;
  }

  const [call] = await db
    .update(calls)
    .set(updateData)
    .where(eq(calls.id, callId))
    .returning({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    });

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function markCallConnectedRecord(
  callId: string,
  connectedAt: string
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [call] = await db
    .update(calls)
    .set({
      connectedAt: new Date(connectedAt),
      startedAt: new Date(connectedAt),
      status: "active",
    })
    .where(eq(calls.id, callId))
    .returning({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    });

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function updateCallStatusRecord(
  callId: string,
  status: CallStatus
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [call] = await db
    .update(calls)
    .set({ status })
    .where(eq(calls.id, callId))
    .returning({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    });

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function saveUserNotificationsRecord(
  userId: string,
  notifications: NotificationSettingsRecord
) {
  const { db } = await import("./drizzle.js");
  const { userNotificationSettings } = await import("./schema/index.js");

  const [settings] = await db
    .insert(userNotificationSettings)
    .values({
      userId,
      incomingCall: notifications.incomingCall,
      callSummary: notifications.callSummary,
      walletAlert: notifications.walletAlert,
      marketing: notifications.marketing,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userNotificationSettings.userId,
      set: {
        incomingCall: notifications.incomingCall,
        callSummary: notifications.callSummary,
        walletAlert: notifications.walletAlert,
        marketing: notifications.marketing,
        updatedAt: new Date(),
      },
    })
    .returning({
      incomingCall: userNotificationSettings.incomingCall,
      callSummary: userNotificationSettings.callSummary,
      walletAlert: userNotificationSettings.walletAlert,
      marketing: userNotificationSettings.marketing,
    });

  return settings;
}

export async function updateUserProfileRecord(
  id: string,
  payload: { name?: string; bio?: string | null }
): Promise<Pick<UserRecord, "id" | "name" | "bio"> | null> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const updateData: Record<string, string | null> = {};
  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }
  if (payload.bio !== undefined) {
    updateData.bio = payload.bio;
  }

  if (Object.keys(updateData).length === 0) {
    const [user] = await db
      .select({ id: users.id, name: users.name, bio: users.bio })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  }

  const [user] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning({ id: users.id, name: users.name, bio: users.bio });

  return user ?? null;
}

export async function updateUserAvatarUrl(
  id: string,
  avatarUrl: string
): Promise<{ id: string; avatar_url: string } | null> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [user] = await db
    .update(users)
    .set({ avatarUrl })
    .where(eq(users.id, id))
    .returning({ id: users.id, avatar_url: users.avatarUrl });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    avatar_url: user.avatar_url ?? "",
  };
}

export async function fetchUserPasswordHash(
  id: string
): Promise<string | null> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [user] = await db
    .select({ password_hash: users.passwordHash })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user?.password_hash ?? null;
}

export async function updateUserPasswordHash(
  id: string,
  newHash: string
): Promise<boolean> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const result = await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, id));

  return result.rowCount ? result.rowCount > 0 : false;
}

export async function softDeleteUserRecord(
  id: string
): Promise<"not_found" | "already_deleted" | "success"> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [user] = await db
    .select({ isDeleted: users.isDeleted })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) return "not_found";
  if (user.isDeleted) return "already_deleted";

  await db
    .update(users)
    .set({
      isDeleted: true,
      name: "退会ユーザー",
      avatarUrl: null,
      bio: null,
      gender: null,
      birthday: null,
    })
    .where(eq(users.id, id));

  return "success";
}

export async function deleteUserSettingsRecord(id: string): Promise<void> {
  const { db } = await import("./drizzle.js");
  const { userNotificationSettings } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  await db
    .delete(userNotificationSettings)
    .where(eq(userNotificationSettings.userId, id));
}

export type OtomoListFilters = {
  isOnline?: boolean;
  genre?: string;
  minAge?: number;
  maxAge?: number;
  limit: number;
  offset: number;
};

export type OtomoReviewFilters = {
  limit: number;
  offset: number;
  sort: "newest" | "highest" | "lowest";
};

export async function fetchOtomoList(filters: OtomoListFilters) {
  const { db } = await import("./drizzle.js");
  const { otomoProfiles } = await import("./schema/index.js");
  const { eq, and, gte, lte, arrayContains, count } = await import(
    "drizzle-orm"
  );

  // WHERE条件を構築
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [];

  if (typeof filters.isOnline === "boolean") {
    conditions.push(eq(otomoProfiles.isOnline, filters.isOnline));
  }

  if (filters.genre) {
    conditions.push(arrayContains(otomoProfiles.genres, [filters.genre]));
  }

  if (typeof filters.minAge === "number") {
    conditions.push(gte(otomoProfiles.age, filters.minAge));
  }

  if (typeof filters.maxAge === "number") {
    conditions.push(lte(otomoProfiles.age, filters.maxAge));
  }

  const whereClause =
    conditions.length > 1
      ? and(...conditions)
      : conditions.length === 1
      ? conditions[0]
      : undefined;

  // 総数を取得
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(otomoProfiles)
    .where(whereClause);

  // データを取得
  const start = Math.max(filters.offset, 0);
  const limit = Math.max(filters.limit, 0);

  const otomos = await db
    .select()
    .from(otomoProfiles)
    .where(whereClause)
    .limit(limit)
    .offset(start);

  const items = otomos.map((otomo) => ({
    otomoId: otomo.id,
    ownerUserId: otomo.ownerUserId,
    displayName: otomo.displayName,
    profileImageUrl: otomo.profileImageUrl ?? "",
    age: otomo.age ?? 0,
    gender: (otomo.gender as "female" | "male" | "other") ?? "other",
    genres: otomo.genres ?? [],
    introduction: otomo.introduction ?? "",
    tags: otomo.tags ?? [],
    isOnline: otomo.isOnline,
    isAvailable: otomo.isAvailable,
    statusMessage: otomo.statusMessage,
    statusUpdatedAt: otomo.statusUpdatedAt.toISOString(),
    pricePerMinute: otomo.pricePerMinute,
    rating: Number(otomo.rating),
    reviewCount: otomo.reviewCount,
    reviews: [], // レビューは別途取得
    schedule: (otomo.schedule as OtomoScheduleRecord[]) ?? [],
  }));

  return { items, total };
}

export async function fetchOtomoById(
  otomoId: string
): Promise<OtomoRecord | null> {
  const { db } = await import("./drizzle.js");
  const { otomoProfiles } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [otomo] = await db
    .select()
    .from(otomoProfiles)
    .where(eq(otomoProfiles.id, otomoId))
    .limit(1);

  if (!otomo) {
    return null;
  }

  return {
    otomoId: otomo.id,
    ownerUserId: otomo.ownerUserId,
    displayName: otomo.displayName,
    profileImageUrl: otomo.profileImageUrl ?? "",
    age: otomo.age ?? 0,
    gender: (otomo.gender as "female" | "male" | "other") ?? "other",
    genres: otomo.genres ?? [],
    introduction: otomo.introduction ?? "",
    tags: otomo.tags ?? [],
    isOnline: otomo.isOnline,
    isAvailable: otomo.isAvailable,
    statusMessage: otomo.statusMessage,
    statusUpdatedAt: otomo.statusUpdatedAt.toISOString(),
    pricePerMinute: otomo.pricePerMinute,
    rating: Number(otomo.rating),
    reviewCount: otomo.reviewCount,
    reviews: [], // レビューは別テーブルから取得する必要がある
    schedule: (otomo.schedule as OtomoScheduleRecord[]) ?? [],
  };
}

export async function fetchOtomoByOwnerUserId(
  ownerUserId: string
): Promise<OtomoRecord | null> {
  const { db } = await import("./drizzle.js");
  const { otomoProfiles } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [otomo] = await db
    .select()
    .from(otomoProfiles)
    .where(eq(otomoProfiles.ownerUserId, ownerUserId))
    .limit(1);

  if (!otomo) {
    return null;
  }

  return {
    otomoId: otomo.id,
    ownerUserId: otomo.ownerUserId,
    displayName: otomo.displayName,
    profileImageUrl: otomo.profileImageUrl ?? "",
    age: otomo.age ?? 0,
    gender: (otomo.gender as "female" | "male" | "other") ?? "other",
    genres: otomo.genres ?? [],
    introduction: otomo.introduction ?? "",
    tags: otomo.tags ?? [],
    isOnline: otomo.isOnline,
    isAvailable: otomo.isAvailable,
    statusMessage: otomo.statusMessage,
    statusUpdatedAt: otomo.statusUpdatedAt.toISOString(),
    pricePerMinute: otomo.pricePerMinute,
    rating: Number(otomo.rating),
    reviewCount: otomo.reviewCount,
    reviews: [], // レビューは別テーブルから取得する必要がある
    schedule: (otomo.schedule as OtomoScheduleRecord[]) ?? [],
  };
}

export async function updateOtomoStatusRecord(
  otomoId: string,
  payload: {
    isOnline: boolean;
    isAvailable: boolean;
    statusMessage: string | null;
    statusUpdatedAt: string;
  }
): Promise<{
  otomoId: string;
  isOnline: boolean;
  isAvailable: boolean;
  statusMessage: string | null;
  statusUpdatedAt: string;
} | null> {
  const { db } = await import("./drizzle.js");
  const { otomoProfiles } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [updated] = await db
    .update(otomoProfiles)
    .set({
      isOnline: payload.isOnline,
      isAvailable: payload.isAvailable,
      statusMessage: payload.statusMessage,
      statusUpdatedAt: new Date(payload.statusUpdatedAt),
    })
    .where(eq(otomoProfiles.id, otomoId))
    .returning({
      otomoId: otomoProfiles.id,
      isOnline: otomoProfiles.isOnline,
      isAvailable: otomoProfiles.isAvailable,
      statusMessage: otomoProfiles.statusMessage,
      statusUpdatedAt: otomoProfiles.statusUpdatedAt,
    });

  if (!updated) {
    return null;
  }

  return {
    otomoId: updated.otomoId,
    isOnline: updated.isOnline,
    isAvailable: updated.isAvailable,
    statusMessage: updated.statusMessage,
    statusUpdatedAt: updated.statusUpdatedAt.toISOString(),
  };
}

export async function fetchOtomoReviews(
  otomoId: string,
  filters: OtomoReviewFilters
): Promise<{ items: OtomoReviewRecord[]; total: number } | null> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void otomoId;
  void filters;
  // TODO: レビューテーブルのスキーマ実装後にDB取得処理を追加する
  // 現在はレビュー機能が未実装のため空の結果を返す
  return { items: [], total: 0 };
}
