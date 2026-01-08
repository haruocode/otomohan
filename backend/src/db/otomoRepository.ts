export type OtomoRecord = {
  otomoId: string;
  ownerUserId: string;
  name: string;
  bio: string;
  avatarUrl: string;
  genre: string[];
  ageMin: number;
  ageMax: number;
  status: "online" | "offline" | "busy";
  averageRating: number;
  reviewCount: number;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
};

export type OtomoReviewRecord = {
  reviewId: string;
  callId: string;
  userId: string;
  otomoId: string;
  rating: number;
  comment: string;
  createdAt: string;
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
  ageMin?: number;
  ageMax?: number;
  minRating?: number;
};

export type OtomoReviewFilters = {
  otomoId: string;
  limit: number;
  offset: number;
};

export async function fetchOtomoList(options: {
  limit: number;
  offset: number;
  filters?: OtomoListFilters;
}): Promise<{ items: OtomoRecord[]; total: number }> {
  const { db } = await import("./drizzle.js");
  const { otomoProfiles } = await import("./schema/index.js");
  const { eq, desc, count, and, sql } = await import("drizzle-orm");

  const safeLimit = Math.max(options.limit, 0);
  const safeOffset = Math.max(options.offset, 0);

  const whereConditions = [];

  if (options.filters?.isOnline) {
    whereConditions.push(eq(otomoProfiles.status, "online"));
  }

  if (options.filters?.genres && options.filters.genres.length > 0) {
    whereConditions.push(
      sql`${otomoProfiles.genre} && ${options.filters.genres}::text[]`
    );
  }

  if (options.filters?.ageMin !== undefined) {
    whereConditions.push(
      sql`${otomoProfiles.ageMax} >= ${options.filters.ageMin}`
    );
  }

  if (options.filters?.ageMax !== undefined) {
    whereConditions.push(
      sql`${otomoProfiles.ageMin} <= ${options.filters.ageMax}`
    );
  }

  if (options.filters?.minRating !== undefined) {
    whereConditions.push(
      sql`${otomoProfiles.averageRating} >= ${options.filters.minRating}`
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
      name: otomoProfiles.name,
      bio: otomoProfiles.bio,
      avatarUrl: otomoProfiles.avatarUrl,
      genre: otomoProfiles.genre,
      ageMin: otomoProfiles.ageMin,
      ageMax: otomoProfiles.ageMax,
      status: otomoProfiles.status,
      averageRating: otomoProfiles.averageRating,
      reviewCount: otomoProfiles.reviewCount,
      totalPoints: otomoProfiles.totalPoints,
      createdAt: otomoProfiles.createdAt,
      updatedAt: otomoProfiles.updatedAt,
    })
    .from(otomoProfiles)
    .where(whereClause)
    .orderBy(desc(otomoProfiles.createdAt))
    .limit(safeLimit)
    .offset(safeOffset);

  const items = profiles.map((profile) => ({
    otomoId: profile.otomoId,
    ownerUserId: profile.ownerUserId,
    name: profile.name,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl ?? "",
    genre: profile.genre ?? [],
    ageMin: profile.ageMin,
    ageMax: profile.ageMax,
    status: profile.status as "online" | "offline" | "busy",
    averageRating: profile.averageRating,
    reviewCount: profile.reviewCount,
    totalPoints: profile.totalPoints,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
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
      name: otomoProfiles.name,
      bio: otomoProfiles.bio,
      avatarUrl: otomoProfiles.avatarUrl,
      genre: otomoProfiles.genre,
      ageMin: otomoProfiles.ageMin,
      ageMax: otomoProfiles.ageMax,
      status: otomoProfiles.status,
      averageRating: otomoProfiles.averageRating,
      reviewCount: otomoProfiles.reviewCount,
      totalPoints: otomoProfiles.totalPoints,
      createdAt: otomoProfiles.createdAt,
      updatedAt: otomoProfiles.updatedAt,
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
    name: profile.name,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl ?? "",
    genre: profile.genre ?? [],
    ageMin: profile.ageMin,
    ageMax: profile.ageMax,
    status: profile.status as "online" | "offline" | "busy",
    averageRating: profile.averageRating,
    reviewCount: profile.reviewCount,
    totalPoints: profile.totalPoints,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
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
      name: otomoProfiles.name,
      bio: otomoProfiles.bio,
      avatarUrl: otomoProfiles.avatarUrl,
      genre: otomoProfiles.genre,
      ageMin: otomoProfiles.ageMin,
      ageMax: otomoProfiles.ageMax,
      status: otomoProfiles.status,
      averageRating: otomoProfiles.averageRating,
      reviewCount: otomoProfiles.reviewCount,
      totalPoints: otomoProfiles.totalPoints,
      createdAt: otomoProfiles.createdAt,
      updatedAt: otomoProfiles.updatedAt,
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
    name: profile.name,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl ?? "",
    genre: profile.genre ?? [],
    ageMin: profile.ageMin,
    ageMax: profile.ageMax,
    status: profile.status as "online" | "offline" | "busy",
    averageRating: profile.averageRating,
    reviewCount: profile.reviewCount,
    totalPoints: profile.totalPoints,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export async function updateOtomoStatusRecord(
  otomoId: string,
  status: "online" | "offline" | "busy"
): Promise<OtomoRecord | null> {
  const { db } = await import("./drizzle.js");
  const { otomoProfiles } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [profile] = await db
    .update(otomoProfiles)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(otomoProfiles.id, otomoId))
    .returning({
      otomoId: otomoProfiles.id,
      ownerUserId: otomoProfiles.ownerUserId,
      name: otomoProfiles.name,
      bio: otomoProfiles.bio,
      avatarUrl: otomoProfiles.avatarUrl,
      genre: otomoProfiles.genre,
      ageMin: otomoProfiles.ageMin,
      ageMax: otomoProfiles.ageMax,
      status: otomoProfiles.status,
      averageRating: otomoProfiles.averageRating,
      reviewCount: otomoProfiles.reviewCount,
      totalPoints: otomoProfiles.totalPoints,
      createdAt: otomoProfiles.createdAt,
      updatedAt: otomoProfiles.updatedAt,
    });

  if (!profile) {
    return null;
  }

  return {
    otomoId: profile.otomoId,
    ownerUserId: profile.ownerUserId,
    name: profile.name,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl ?? "",
    genre: profile.genre ?? [],
    ageMin: profile.ageMin,
    ageMax: profile.ageMax,
    status: profile.status as "online" | "offline" | "busy",
    averageRating: profile.averageRating,
    reviewCount: profile.reviewCount,
    totalPoints: profile.totalPoints,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
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
