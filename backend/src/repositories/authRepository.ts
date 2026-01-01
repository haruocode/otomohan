import {
  upsertRefreshTokenRecord,
  fetchRefreshTokenRecord,
} from "../db/index.js";

export type RefreshTokenEntity = {
  token: string;
  userId: string;
  expiresAt: string;
};

export async function saveRefreshTokenForUser(entry: {
  userId: string;
  token: string;
  expiresAt: string;
}): Promise<RefreshTokenEntity> {
  return upsertRefreshTokenRecord(entry);
}

export async function findRefreshToken(
  token: string
): Promise<RefreshTokenEntity | null> {
  return fetchRefreshTokenRecord(token);
}
