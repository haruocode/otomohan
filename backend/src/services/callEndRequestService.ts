import { getCallById } from "../repositories/callRepository.js";
import { findOtomoById } from "../repositories/otomoRepository.js";
import { stopCallBillingTimer } from "./callBillingTimer.js";
import {
  finalizeCallSessionAndBroadcast,
  type CallEndReason,
} from "./callLifecycleService.js";

export type CallEndRequestResult =
  | {
      success: true;
      callId: string;
      reason: CallEndReason;
      alreadyEnded: boolean;
    }
  | {
      success: false;
      reason: "CALL_NOT_FOUND" | "FORBIDDEN" | "INVALID_STATE";
    };

export async function handleCallEndRequestByParticipant(options: {
  callId: string;
  requesterUserId: string;
}): Promise<CallEndRequestResult> {
  const trimmedCallId = options.callId.trim();
  if (!trimmedCallId) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  const call = await getCallById(trimmedCallId);
  if (!call) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  if (call.status === "ended" || call.status === "failed") {
    return { success: false, reason: "INVALID_STATE" };
  }

  if (call.status !== "accepted" && call.status !== "active") {
    return { success: false, reason: "INVALID_STATE" };
  }

  const otomo = await findOtomoById(call.otomoId);
  if (!otomo) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  let reason: CallEndReason | null = null;
  if (call.userId === options.requesterUserId) {
    reason = "user_end";
  } else if (otomo.ownerUserId === options.requesterUserId) {
    reason = "otomo_end";
  }

  if (!reason) {
    return { success: false, reason: "FORBIDDEN" };
  }

  stopCallBillingTimer(trimmedCallId, reason);

  const finalizeResult = await finalizeCallSessionAndBroadcast({
    callId: trimmedCallId,
    reason,
  });

  if (!finalizeResult.success) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  return {
    success: true,
    callId: trimmedCallId,
    reason,
    alreadyEnded: finalizeResult.alreadyEnded,
  };
}
