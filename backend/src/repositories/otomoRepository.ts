import {
  fetchOtomoList,
  fetchOtomoById,
  type OtomoListFilters,
} from "../db/index.js";

export async function listOtomo(filters: OtomoListFilters) {
  return fetchOtomoList(filters);
}

export async function findOtomoById(otomoId: string) {
  return fetchOtomoById(otomoId);
}
