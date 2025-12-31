import {
  fetchOtomoList,
  fetchOtomoById,
  type OtomoListFilters,
  fetchOtomoReviews,
  type OtomoReviewFilters,
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
