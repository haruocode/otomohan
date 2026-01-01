import {
  fetchCallsForParticipant,
  fetchCallById,
  fetchCallBillingUnits,
} from "../db/index.js";

export type CallEntity = {
  callId: string;
  userId: string;
  otomoId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  billedUnits: number;
  billedPoints: number;
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
