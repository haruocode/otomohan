// Auth Repository exports
export {
  upsertRefreshTokenRecord,
  fetchRefreshTokenRecord,
} from "./authRepository.js";
export type { RefreshTokenRecord } from "./authRepository.js";

// User Repository exports
export {
  fetchUserById,
  fetchUserByEmail,
  insertUserRecord,
  fetchUserNotifications,
  updateUserProfileRecord,
  updateUserAvatarUrl,
  fetchUserPasswordHash,
  updateUserPasswordHash,
  softDeleteUserRecord,
  deleteUserSettingsRecord,
  saveUserNotificationsRecord,
} from "./userRepository.js";
export type { UserRecord } from "./userRepository.js";

// Wallet Repository exports
export {
  fetchWalletByUserId,
  fetchActiveWalletPlans,
  fetchWalletPlanById,
  incrementWalletBalanceRecord,
  isPaymentAlreadyProcessed,
  insertWalletHistoryRecord,
  fetchWalletHistoryForUser,
  fetchWalletUsageForUser,
} from "./walletRepository.js";
export type {
  WalletRecord,
  WalletPlanRecord,
  WalletHistoryRecord,
  WalletHistoryViewRecord,
  WalletUsageRecord,
  WalletUsageViewRecord,
} from "./walletRepository.js";

// Call Repository exports
export {
  fetchCallsForParticipant,
  fetchCallById,
  fetchCallBillingUnits,
  insertCallBillingUnitRecord,
  updateCallBillingProgressRecord,
  insertCallRequestRecord,
  findActiveCallForParticipant,
  finalizeCallRecord,
  finalizeCallSessionRecord,
  markCallConnectedRecord,
  updateCallStatusRecord,
} from "./callRepository.js";
export type { CallRecord, CallBillingUnitRecord } from "./callRepository.js";
export { CALL_END_REASON_VALUES } from "./callRepository.js";
export type { CallStatus, CallEndReason } from "./callRepository.js";

// Otomo Repository exports
export {
  fetchOtomoList,
  fetchOtomoById,
  fetchOtomoByOwnerUserId,
  updateOtomoStatusRecord,
  fetchOtomoReviews,
} from "./otomoRepository.js";
export type {
  OtomoRecord,
  OtomoReviewRecord,
  OtomoScheduleRecord,
  OtomoListFilters,
  OtomoReviewFilters,
  OtomoStatusUpdate,
} from "./otomoRepository.js";
