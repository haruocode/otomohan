export type WalletRecord = {
  userId: string;
  balance: number;
  updatedAt: string;
};

export type WalletPlanRecord = {
  planId: string;
  title: string;
  price: number;
  points: number;
  bonusPoints: number;
  description: string;
  isActive: boolean;
};

export type WalletHistoryRecord = {
  historyId: string;
  userId: string;
  planId: string;
  paymentId: string;
  amount: number;
  points: number;
  bonusPoints: number;
  createdAt: string;
};

export type WalletHistoryViewRecord = WalletHistoryRecord & {
  planTitle: string;
};

export type WalletUsageRecord = {
  usageId: string;
  userId: string;
  callId: string;
  otomoId: string;
  usedPoints: number;
  durationMinutes: number;
  createdAt: string;
};

export type WalletUsageViewRecord = WalletUsageRecord & {
  otomoName: string;
};

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
