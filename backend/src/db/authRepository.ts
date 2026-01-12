export type RefreshTokenRecord = {
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
