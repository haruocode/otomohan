import {
  fetchCallsForParticipant,
  fetchCallById,
  fetchCallBillingUnits,
  finalizeCallRecord,
  insertCallRequestRecord,
  findActiveCallForParticipant as findActiveCallForParticipantDb,
  updateCallStatusRecord,
  markCallConnectedRecord,
  finalizeCallSessionRecord,
  insertCallBillingUnitRecord,
  updateCallBillingProgressRecord,
  type CallStatus,
  type CallEndReason,
} from "../db/index.js";

export type CallEntity = {
  callId: string;
  userId: string;
  otomoId: string;
  startedAt: string;
  endedAt: string;
  connectedAt: string | null;
  durationSeconds: number;
  billedUnits: number;
  billedPoints: number;
  status: CallStatus;
  endReason: CallEndReason | null;
};

export async function listCallsForAccount(options: {
  accountId: string;
  role: "user" | "otomo";
  limit: number;
  offset: number;
}): Promise<{ items: CallEntity[]; total: number }> {
  return fetchCallsForParticipant({
    participantId: options.accountId,
    participantType: options.role,
    limit: options.limit,
    offset: options.offset,
  });
}

export async function getCallById(callId: string): Promise<CallEntity | null> {
  return fetchCallById(callId);
}

export type CallBillingUnitEntity = {
  unitId: string;
  callId: string;
  minuteIndex: number;
  chargedPoints: number;
  timestamp: string;
};

export async function listCallBillingUnits(
  callId: string
): Promise<CallBillingUnitEntity[]> {
  return fetchCallBillingUnits(callId);
}

export async function finalizeCallDebugTotals(options: {
  callId: string;
  endedAt: string;
  durationSeconds: number;
  billedUnits: number;
  billedPoints: number;
}): Promise<CallEntity | null> {
  return finalizeCallRecord(options.callId, {
    endedAt: options.endedAt,
    durationSeconds: options.durationSeconds,
    billedUnits: options.billedUnits,
    billedPoints: options.billedPoints,
  });
}

export async function createPendingCallRecord(entry: {
  callId: string;
  userId: string;
  otomoId: string;
  startedAt?: string;
}) {
  return insertCallRequestRecord(entry);
}

export async function findActiveCallForParticipant(participantId: string) {
  return findActiveCallForParticipantDb(participantId);
}

export async function updateCallStatus(callId: string, status: CallStatus) {
  return updateCallStatusRecord(callId, status);
}

export async function markCallConnected(callId: string, connectedAt: string) {
  return markCallConnectedRecord(callId, connectedAt);
}

export type { CallEndReason };

export async function finalizeCallSession(options: {
  callId: string;
  endedAt: string;
  durationSeconds: number;
  endReason: CallEndReason;
  billedUnits?: number;
  billedPoints?: number;
}) {
  return finalizeCallSessionRecord(options.callId, options);
}

export async function recordCallBillingUnit(entry: {
  callId: string;
  minuteIndex: number;
  chargedPoints: number;
  timestamp: string;
}) {
  return insertCallBillingUnitRecord(entry);
}

export async function updateCallBillingProgress(options: {
  callId: string;
  billedUnits: number;
  billedPointsDelta: number;
  durationSeconds: number;
  endedAt: string;
}) {
  const { callId, ...payload } = options;
  return updateCallBillingProgressRecord(callId, payload);
}
