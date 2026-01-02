import {
  getCallById,
  createPendingCallRecord,
  findActiveCallForParticipant,
  updateCallStatus,
} from "../repositories/callRepository.js";
import { getUserById } from "../repositories/userRepository.js";
import {
  findOtomoByOwnerUserId,
  findOtomoById,
  updateOtomoStatus,
} from "../repositories/otomoRepository.js";

export type CallRequestSuccess = {
  success: true;
  callId: string;
  caller: {
    id: string;
    name: string;
    avatar: string | null;
  };
  target: {
    ownerUserId: string;
    otomoId: string;
    displayName: string;
  };
};

export type CallRequestFailure = {
  success: false;
  reason:
    | "CALLER_NOT_FOUND"
    | "OTOMO_NOT_FOUND"
    | "DUPLICATE_CALL_ID"
    | "OTOMO_OFFLINE"
    | "OTOMO_BUSY"
    | "CALLER_BUSY";
};

export type CallRequestResult = CallRequestSuccess | CallRequestFailure;

export type CallAcceptSuccess = {
  success: true;
  callId: string;
  callerUserId: string;
  timestamp: number;
};

export type CallAcceptFailure = {
  success: false;
  reason: "CALL_NOT_FOUND" | "FORBIDDEN" | "INVALID_STATE";
};

export type CallAcceptResult = CallAcceptSuccess | CallAcceptFailure;

export async function initiateCallRequest(options: {
  callId: string;
  callerId: string;
  targetUserId: string;
}): Promise<CallRequestResult> {
  const trimmedCallId = options.callId.trim();
  if (!trimmedCallId) {
    return { success: false, reason: "DUPLICATE_CALL_ID" };
  }

  const caller = await getUserById(options.callerId);
  if (!caller) {
    return { success: false, reason: "CALLER_NOT_FOUND" };
  }

  const otomo = await findOtomoByOwnerUserId(options.targetUserId);
  if (!otomo) {
    return { success: false, reason: "OTOMO_NOT_FOUND" };
  }

  const existingCall = await getCallById(trimmedCallId);
  if (existingCall) {
    return { success: false, reason: "DUPLICATE_CALL_ID" };
  }

  if (!otomo.isOnline) {
    return { success: false, reason: "OTOMO_OFFLINE" };
  }

  if (!otomo.isAvailable) {
    return { success: false, reason: "OTOMO_BUSY" };
  }

  const callerActiveCall = await findActiveCallForParticipant(caller.id);
  if (callerActiveCall) {
    return { success: false, reason: "CALLER_BUSY" };
  }

  const otomoActiveCall = await findActiveCallForParticipant(otomo.otomoId);
  if (otomoActiveCall) {
    return { success: false, reason: "OTOMO_BUSY" };
  }

  const now = new Date().toISOString();
  await createPendingCallRecord({
    callId: trimmedCallId,
    userId: caller.id,
    otomoId: otomo.otomoId,
    startedAt: now,
  });

  await updateOtomoStatus(otomo.otomoId, {
    isOnline: true,
    isAvailable: false,
    statusMessage: "通話リクエスト受付中",
    statusUpdatedAt: now,
  });

  return {
    success: true,
    callId: trimmedCallId,
    caller: {
      id: caller.id,
      name: caller.name,
      avatar: caller.avatar_url,
    },
    target: {
      ownerUserId: otomo.ownerUserId,
      otomoId: otomo.otomoId,
      displayName: otomo.displayName,
    },
  };
}

export async function acceptCallRequest(options: {
  callId: string;
  responderUserId: string;
}): Promise<CallAcceptResult> {
  const trimmedCallId = options.callId.trim();
  if (!trimmedCallId) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  const call = await getCallById(trimmedCallId);
  if (!call) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  if (call.status === "ended") {
    return { success: false, reason: "INVALID_STATE" };
  }

  const otomo = await findOtomoById(call.otomoId);
  if (!otomo) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  if (otomo.ownerUserId !== options.responderUserId) {
    return { success: false, reason: "FORBIDDEN" };
  }

  if (call.status !== "requesting" && call.status !== "ringing") {
    return { success: false, reason: "INVALID_STATE" };
  }

  await updateCallStatus(call.callId, "accepted");

  const now = new Date();
  await updateOtomoStatus(otomo.otomoId, {
    isOnline: true,
    isAvailable: false,
    statusMessage: "通話接続準備中",
    statusUpdatedAt: now.toISOString(),
  });

  return {
    success: true,
    callId: call.callId,
    callerUserId: call.userId,
    timestamp: Math.floor(now.getTime() / 1000),
  };
}
