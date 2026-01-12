import {
  fetchOtomoList,
  fetchOtomoById,
  type OtomoListFilters,
  fetchOtomoReviews,
  type OtomoReviewFilters,
  updateOtomoStatusRecord,
  fetchOtomoByOwnerUserId,
  type OtomoStatusUpdate,
} from "../db/index.js";

export async function listOtomo(options: {
  limit: number;
  offset: number;
  filters?: OtomoListFilters;
}) {
  return fetchOtomoList(options);
}

export async function findOtomoById(otomoId: string) {
  return fetchOtomoById(otomoId);
}

export async function findOtomoByOwnerUserId(ownerUserId: string) {
  return fetchOtomoByOwnerUserId(ownerUserId);
}

export async function listOtomoReviews(options: OtomoReviewFilters) {
  return fetchOtomoReviews(options);
}

export async function updateOtomoStatus(
  otomoId: string,
  status: "online" | "offline" | "busy" | OtomoStatusUpdate
) {
  return updateOtomoStatusRecord(otomoId, status);
}
