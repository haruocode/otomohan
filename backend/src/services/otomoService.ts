import { listOtomo } from "../repositories/otomoRepository.js";

export type OtomoListQuery = {
  isOnline?: boolean;
  genre?: string;
  minAge?: number;
  maxAge?: number;
  limit?: number;
  offset?: number;
};

export type OtomoListItem = {
  otomoId: string;
  displayName: string;
  profileImageUrl: string;
  age: number;
  gender: "female" | "male" | "other";
  genres: string[];
  isOnline: boolean;
  isAvailable: boolean;
  pricePerMinute: number;
  rating: number;
  reviewCount: number;
};

export type OtomoListResult = {
  items: OtomoListItem[];
  total: number;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function getOtomoList(
  query: OtomoListQuery
): Promise<OtomoListResult> {
  const limit = normalizeLimit(query.limit);
  const offset = normalizeOffset(query.offset);

  const { items, total } = await listOtomo({
    isOnline: query.isOnline,
    genre: query.genre,
    minAge: query.minAge,
    maxAge: query.maxAge,
    limit,
    offset,
  });

  return {
    items: items.map((item) => ({
      otomoId: item.otomoId,
      displayName: item.displayName,
      profileImageUrl: item.profileImageUrl,
      age: item.age,
      gender: item.gender,
      genres: item.genres,
      isOnline: item.isOnline,
      isAvailable: item.isAvailable,
      pricePerMinute: item.pricePerMinute,
      rating: item.rating,
      reviewCount: item.reviewCount,
    })),
    total,
  };
}

function normalizeLimit(limit?: number) {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT);
}

function normalizeOffset(offset?: number) {
  if (typeof offset !== "number" || Number.isNaN(offset)) {
    return 0;
  }
  return Math.max(Math.trunc(offset), 0);
}
