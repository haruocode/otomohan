import { fetchOtomoList, type OtomoListFilters } from "../db/index.js";

export async function listOtomo(filters: OtomoListFilters) {
  return fetchOtomoList(filters);
}
