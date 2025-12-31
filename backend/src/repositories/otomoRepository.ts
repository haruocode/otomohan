import {
  fetchOtomoList,
  fetchOtomoById,
  type OtomoListFilters,
  fetchOtomoReviews,
  type OtomoReviewFilters,
  updateOtomoStatusRecord,
} from "../db/index.js";

export async function listOtomo(filters: OtomoListFilters) {
  return fetchOtomoList(filters);
}

export async function findOtomoById(otomoId: string) {
  return fetchOtomoById(otomoId);
}

export async function listOtomoReviews(
  otomoId: string,
  filters: OtomoReviewFilters
) {
  return fetchOtomoReviews(otomoId, filters);
}

export async function updateOtomoStatus(
  otomoId: string,
  payload: {
    isOnline: boolean;
    isAvailable: boolean;
    statusMessage: string | null;
    statusUpdatedAt: string;
  }
) {
  return updateOtomoStatusRecord(otomoId, payload);
}
