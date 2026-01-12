import type { ScheduleSlot } from "./schema/index.js";

/**
 * Otomoレコード型 - スキーマに合わせた正確な型定義
 */
export type OtomoRecord = {
  otomoId: string;
  ownerUserId: string;
  displayName: string;
  profileImageUrl: string | null;
  age: number | null;
  gender: string | null;
  introduction: string | null;
  tags: string[] | null;
  genres: string[] | null;
  statusMessage: string | null;
  isOnline: boolean;
  isAvailable: boolean;
  pricePerMinute: number;
  rating: string;
  reviewCount: number;
  statusUpdatedAt: string;
  schedule: ScheduleSlot[];
};

export type OtomoReviewRecord = {
  reviewId: string;
  callId: string;
  userId: string;
  otomoId: string;
  rating: number;
  comment: string;
  createdAt: string;
  // ユーザー結合時に取得
  userDisplayName: string;
  // rating を score としてもエイリアス
  score: number;
};

export type OtomoScheduleRecord = {
  scheduleId: string;
  otomoId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type OtomoListFilters = {
  isOnline?: boolean;
  genres?: string[];
  minAge?: number;
  maxAge?: number;
  minRating?: number;
};

export type OtomoReviewFilters = {
  otomoId: string;
  limit: number;
  offset: number;
  sort?: "newest" | "highest" | "lowest";
};

export async function fetchOtomoList(options: {
  limit: number;
  offset: number;
  filters?: OtomoListFilters;
}): Promise<{ items: OtomoRecord[]; total: number }> {
  const { db } = await import("./drizzle.js");
  const { otomoProfiles } = await import("./schema/index.js");
  const { eq, desc, count, and, sql, gte, lte } = await import("drizzle-orm");

  const safeLimit = Math.max(options.limit, 0);
  const safeOffset = Math.max(options.offset, 0);

  const whereConditions = [];

  if (options.filters?.isOnline) {
    whereConditions.push(eq(otomoProfiles.isOnline, true));
  }

  if (options.filters?.genres && options.filters.genres.length > 0) {
    whereConditions.push(
      sql`${otomoProfiles.genres} && ${options.filters.genres}::text[]`
    );
  }

  if (options.filters?.minAge !== undefined) {
    whereConditions.push(gte(otomoProfiles.age, options.filters.minAge));
  }

  if (options.filters?.maxAge !== undefined) {
    whereConditions.push(lte(otomoProfiles.age, options.filters.maxAge));
  }

  if (options.filters?.minRating !== undefined) {
    whereConditions.push(
      gte(otomoProfiles.rating, String(options.filters.minRating))
    );
  }

  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // 総数を取得
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(otomoProfiles)
    .where(whereClause);

  // データを取得
  const profiles = await db
    .select({
      otomoId: otomoProfiles.id,
      ownerUserId: otomoProfiles.ownerUserId,
      displayName: otomoProfiles.displayName,
      profileImageUrl: otomoProfiles.profileImageUrl,
      age: otomoProfiles.age,
      gender: otomoProfiles.gender,
      introduction: otomoProfiles.introduction,
      tags: otomoProfiles.tags,
      genres: otomoProfiles.genres,
      statusMessage: otomoProfiles.statusMessage,
      isOnline: otomoProfiles.isOnline,
      isAvailable: otomoProfiles.isAvailable,
      pricePerMinute: otomoProfiles.pricePerMinute,
      rating: otomoProfiles.rating,
      reviewCount: otomoProfiles.reviewCount,
      statusUpdatedAt: otomoProfiles.statusUpdatedAt,
      schedule: otomoProfiles.schedule,
    })
    .from(otomoProfiles)
    .where(whereClause)
    .orderBy(desc(otomoProfiles.statusUpdatedAt))
    .limit(safeLimit)
    .offset(safeOffset);

  const items: OtomoRecord[] = profiles.map((profile) => ({
    otomoId: profile.otomoId,
    ownerUserId: profile.ownerUserId,
    displayName: profile.displayName,
    profileImageUrl: profile.profileImageUrl,
    age: profile.age,
    gender: profile.gender,
    introduction: profile.introduction,
    tags: profile.tags,
    genres: profile.genres,
    statusMessage: profile.statusMessage,
    isOnline: profile.isOnline,
    isAvailable: profile.isAvailable,
    pricePerMinute: profile.pricePerMinute,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
    statusUpdatedAt: profile.statusUpdatedAt.toISOString(),
    schedule: profile.schedule,
  }));

  return { items, total };
}

export async function fetchOtomoById(
  otomoId: string
): Promise<OtomoRecord | null> {
  const { db } = await import("./drizzle.js");
  const { otomoProfiles } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [profile] = await db
    .select({
      otomoId: otomoProfiles.id,
      ownerUserId: otomoProfiles.ownerUserId,
      displayName: otomoProfiles.displayName,
      profileImageUrl: otomoProfiles.profileImageUrl,
      age: otomoProfiles.age,
      gender: otomoProfiles.gender,
      introduction: otomoProfiles.introduction,
      tags: otomoProfiles.tags,
      genres: otomoProfiles.genres,
      statusMessage: otomoProfiles.statusMessage,
      isOnline: otomoProfiles.isOnline,
      isAvailable: otomoProfiles.isAvailable,
      pricePerMinute: otomoProfiles.pricePerMinute,
      rating: otomoProfiles.rating,
      reviewCount: otomoProfiles.reviewCount,
      statusUpdatedAt: otomoProfiles.statusUpdatedAt,
      schedule: otomoProfiles.schedule,
    })
    .from(otomoProfiles)
    .where(eq(otomoProfiles.id, otomoId))
    .limit(1);

  if (!profile) {
    return null;
  }

  return {
    otomoId: profile.otomoId,
    ownerUserId: profile.ownerUserId,
    displayName: profile.displayName,
    profileImageUrl: profile.profileImageUrl,
    age: profile.age,
    gender: profile.gender,
    introduction: profile.introduction,
    tags: profile.tags,
    genres: profile.genres,
    statusMessage: profile.statusMessage,
    isOnline: profile.isOnline,
    isAvailable: profile.isAvailable,
    pricePerMinute: profile.pricePerMinute,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
    statusUpdatedAt: profile.statusUpdatedAt.toISOString(),
    schedule: profile.schedule,
  };
}

export async function fetchOtomoByOwnerUserId(
  ownerUserId: string
): Promise<OtomoRecord | null> {
  const { db } = await import("./drizzle.js");
  const { otomoProfiles } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [profile] = await db
    .select({
      otomoId: otomoProfiles.id,
      ownerUserId: otomoProfiles.ownerUserId,
      displayName: otomoProfiles.displayName,
      profileImageUrl: otomoProfiles.profileImageUrl,
      age: otomoProfiles.age,
      gender: otomoProfiles.gender,
      introduction: otomoProfiles.introduction,
      tags: otomoProfiles.tags,
      genres: otomoProfiles.genres,
      statusMessage: otomoProfiles.statusMessage,
      isOnline: otomoProfiles.isOnline,
      isAvailable: otomoProfiles.isAvailable,
      pricePerMinute: otomoProfiles.pricePerMinute,
      rating: otomoProfiles.rating,
      reviewCount: otomoProfiles.reviewCount,
      statusUpdatedAt: otomoProfiles.statusUpdatedAt,
      schedule: otomoProfiles.schedule,
    })
    .from(otomoProfiles)
    .where(eq(otomoProfiles.ownerUserId, ownerUserId))
    .limit(1);

  if (!profile) {
    return null;
  }

  return {
    otomoId: profile.otomoId,
    ownerUserId: profile.ownerUserId,
    displayName: profile.displayName,
    profileImageUrl: profile.profileImageUrl,
    age: profile.age,
    gender: profile.gender,
    introduction: profile.introduction,
    tags: profile.tags,
    genres: profile.genres,
    statusMessage: profile.statusMessage,
    isOnline: profile.isOnline,
    isAvailable: profile.isAvailable,
    pricePerMinute: profile.pricePerMinute,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
    statusUpdatedAt: profile.statusUpdatedAt.toISOString(),
    schedule: profile.schedule,
  };
}

export type OtomoStatusUpdate = {
  isOnline: boolean;
  isAvailable: boolean;
  statusMessage?: string | null;
  statusUpdatedAt?: string;
};

export async function updateOtomoStatusRecord(
  otomoId: string,
  status: "online" | "offline" | "busy" | OtomoStatusUpdate
): Promise<OtomoRecord | null> {
  const { db } = await import("./drizzle.js");
  const { otomoProfiles } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  // status の形式に応じて isOnline / isAvailable を決定
  let isOnline: boolean;
  let isAvailable: boolean;
  let statusMessage: string | null | undefined;

  if (typeof status === "string") {
    isOnline = status === "online" || status === "busy";
    isAvailable = status === "online";
    statusMessage = undefined;
  } else {
    isOnline = status.isOnline;
    isAvailable = status.isAvailable;
    statusMessage = status.statusMessage;
  }

  const updateData: Record<string, unknown> = {
    isOnline,
    isAvailable,
    statusUpdatedAt: new Date(),
  };

  if (statusMessage !== undefined) {
    updateData.statusMessage = statusMessage;
  }

  const [profile] = await db
    .update(otomoProfiles)
    .set(updateData)
    .where(eq(otomoProfiles.id, otomoId))
    .returning({
      otomoId: otomoProfiles.id,
      ownerUserId: otomoProfiles.ownerUserId,
      displayName: otomoProfiles.displayName,
      profileImageUrl: otomoProfiles.profileImageUrl,
      age: otomoProfiles.age,
      gender: otomoProfiles.gender,
      introduction: otomoProfiles.introduction,
      tags: otomoProfiles.tags,
      genres: otomoProfiles.genres,
      statusMessage: otomoProfiles.statusMessage,
      isOnline: otomoProfiles.isOnline,
      isAvailable: otomoProfiles.isAvailable,
      pricePerMinute: otomoProfiles.pricePerMinute,
      rating: otomoProfiles.rating,
      reviewCount: otomoProfiles.reviewCount,
      statusUpdatedAt: otomoProfiles.statusUpdatedAt,
      schedule: otomoProfiles.schedule,
    });

  if (!profile) {
    return null;
  }

  return {
    otomoId: profile.otomoId,
    ownerUserId: profile.ownerUserId,
    displayName: profile.displayName,
    profileImageUrl: profile.profileImageUrl,
    age: profile.age,
    gender: profile.gender,
    introduction: profile.introduction,
    tags: profile.tags,
    genres: profile.genres,
    statusMessage: profile.statusMessage,
    isOnline: profile.isOnline,
    isAvailable: profile.isAvailable,
    pricePerMinute: profile.pricePerMinute,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
    statusUpdatedAt: profile.statusUpdatedAt.toISOString(),
    schedule: profile.schedule,
  };
}

export async function fetchOtomoReviews(
  options: OtomoReviewFilters
): Promise<{ items: OtomoReviewRecord[]; total: number }> {
  // TODO: スキーマに otomoReviews テーブルを追加してから実装
  return {
    items: [],
    total: 0,
  };
}
