import {
  listOtomo,
  findOtomoById,
  listOtomoReviews,
} from "../repositories/otomoRepository.js";

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

export type OtomoReview = {
  reviewId: string;
  userDisplayName: string;
  score: number;
  comment: string;
  createdAt: string;
};

export type OtomoReviewListQuery = {
  limit?: number;
  offset?: number;
  sort?: OtomoReviewSort;
};

export type OtomoReviewSort = "newest" | "highest" | "lowest";

export type OtomoScheduleSlot = {
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

export type OtomoDetail = OtomoListItem & {
  introduction: string;
  tags: string[];
  reviews: OtomoReview[];
  schedule: OtomoScheduleSlot[];
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

const MAX_REVIEWS_RETURNED = 5;

export async function getOtomoDetail(
  otomoId: string
): Promise<OtomoDetail | null> {
  const record = await findOtomoById(otomoId);
  if (!record) {
    return null;
  }

  return {
    otomoId: record.otomoId,
    displayName: record.displayName,
    profileImageUrl: record.profileImageUrl,
    age: record.age,
    gender: record.gender,
    genres: record.genres,
    introduction: record.introduction,
    tags: record.tags,
    isOnline: record.isOnline,
    isAvailable: record.isAvailable,
    pricePerMinute: record.pricePerMinute,
    rating: record.rating,
    reviewCount: record.reviewCount,
    reviews: record.reviews.slice(0, MAX_REVIEWS_RETURNED).map((review) => ({
      reviewId: review.reviewId,
      userDisplayName: review.userDisplayName,
      score: review.score,
      comment: review.comment,
      createdAt: review.createdAt,
    })),
    schedule: record.schedule.map((slot) => ({
      dayOfWeek: slot.dayOfWeek,
      start: slot.start,
      end: slot.end,
    })),
  };
}

export async function getOtomoReviews(
  otomoId: string,
  query: OtomoReviewListQuery
): Promise<{ items: OtomoReview[]; total: number } | null> {
  const limit = normalizeLimit(query.limit);
  const offset = normalizeOffset(query.offset);
  const sort = normalizeReviewSort(query.sort);

  const result = await listOtomoReviews(otomoId, { limit, offset, sort });
  if (!result) {
    return null;
  }

  return {
    items: result.items.map((review) => ({
      reviewId: review.reviewId,
      userDisplayName: review.userDisplayName,
      score: review.score,
      comment: review.comment,
      createdAt: review.createdAt,
    })),
    total: result.total,
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

function normalizeReviewSort(sort?: OtomoReviewSort): OtomoReviewSort {
  if (sort === "highest" || sort === "lowest") {
    return sort;
  }
  return "newest";
}
