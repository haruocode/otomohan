export type CallStatus =
  | "requesting"
  | "ringing"
  | "accepted"
  | "active"
  | "failed"
  | "ended";

export const CALL_END_REASON_VALUES = [
  "user_end",
  "otomo_end",
  "no_point",
  "network_lost",
  "timeout",
  "system_error",
] as const;

export type CallEndReason = (typeof CALL_END_REASON_VALUES)[number];

export type CallRecord = {
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

export type CallBillingUnitRecord = {
  unitId: string;
  callId: string;
  minuteIndex: number;
  chargedPoints: number;
  timestamp: string;
};

export async function fetchCallsForParticipant(options: {
  participantId: string;
  participantType: "user" | "otomo";
  limit: number;
  offset: number;
}): Promise<{ items: CallRecord[]; total: number }> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq, desc, count } = await import("drizzle-orm");

  const safeLimit = Math.max(options.limit, 0);
  const safeOffset = Math.max(options.offset, 0);

  const whereClause =
    options.participantType === "user"
      ? eq(calls.userId, options.participantId)
      : eq(calls.otomoId, options.participantId);

  // 総数を取得
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(calls)
    .where(whereClause);

  // データを取得
  const callRecords = await db
    .select({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    })
    .from(calls)
    .where(whereClause)
    .orderBy(desc(calls.startedAt))
    .limit(safeLimit)
    .offset(safeOffset);

  const items = callRecords.map((call) => ({
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  }));

  return { items, total };
}

export async function fetchCallById(
  callId: string
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [call] = await db
    .select({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    })
    .from(calls)
    .where(eq(calls.id, callId))
    .limit(1);

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function fetchCallBillingUnits(
  callId: string
): Promise<CallBillingUnitRecord[]> {
  const { db } = await import("./drizzle.js");
  const { callBillingUnits } = await import("./schema/index.js");
  const { eq, asc } = await import("drizzle-orm");

  const units = await db
    .select({
      unitId: callBillingUnits.id,
      callId: callBillingUnits.callId,
      minuteIndex: callBillingUnits.minuteIndex,
      chargedPoints: callBillingUnits.chargedPoints,
      timestamp: callBillingUnits.timestamp,
    })
    .from(callBillingUnits)
    .where(eq(callBillingUnits.callId, callId))
    .orderBy(asc(callBillingUnits.minuteIndex));

  return units.map((unit) => ({
    unitId: unit.unitId,
    callId: unit.callId,
    minuteIndex: unit.minuteIndex,
    chargedPoints: unit.chargedPoints,
    timestamp: unit.timestamp.toISOString(),
  }));
}

export async function insertCallBillingUnitRecord(entry: {
  callId: string;
  minuteIndex: number;
  chargedPoints: number;
  timestamp: string;
}): Promise<CallBillingUnitRecord> {
  const { db } = await import("./drizzle.js");
  const { callBillingUnits } = await import("./schema/index.js");

  const [unit] = await db
    .insert(callBillingUnits)
    .values({
      callId: entry.callId,
      minuteIndex: entry.minuteIndex,
      chargedPoints: entry.chargedPoints,
      timestamp: new Date(entry.timestamp),
    })
    .returning({
      unitId: callBillingUnits.id,
      callId: callBillingUnits.callId,
      minuteIndex: callBillingUnits.minuteIndex,
      chargedPoints: callBillingUnits.chargedPoints,
      timestamp: callBillingUnits.timestamp,
    });

  return {
    unitId: unit.unitId,
    callId: unit.callId,
    minuteIndex: unit.minuteIndex,
    chargedPoints: unit.chargedPoints,
    timestamp: unit.timestamp.toISOString(),
  };
}

export async function updateCallBillingProgressRecord(
  callId: string,
  payload: {
    billedUnits: number;
    billedPointsDelta: number;
    durationSeconds: number;
    endedAt: string;
  }
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq, sql } = await import("drizzle-orm");

  const [call] = await db
    .update(calls)
    .set({
      billedUnits: sql`GREATEST(${calls.billedUnits}, ${payload.billedUnits})`,
      billedPoints: sql`${calls.billedPoints} + ${payload.billedPointsDelta}`,
      durationSeconds: sql`GREATEST(${calls.durationSeconds}, ${payload.durationSeconds})`,
      endedAt: new Date(payload.endedAt),
    })
    .where(eq(calls.id, callId))
    .returning({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    });

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function insertCallRequestRecord(entry: {
  callId: string;
  userId: string;
  otomoId: string;
  startedAt?: string;
}): Promise<CallRecord> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");

  const now = entry.startedAt ? new Date(entry.startedAt) : new Date();
  const [call] = await db
    .insert(calls)
    .values({
      id: entry.callId,
      userId: entry.userId,
      otomoId: entry.otomoId,
      startedAt: now,
      endedAt: now,
      connectedAt: null,
      durationSeconds: 0,
      billedUnits: 0,
      billedPoints: 0,
      status: "requesting",
      endReason: null,
    })
    .returning({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    });

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function findActiveCallForParticipant(
  participantId: string
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq, or, and, notInArray } = await import("drizzle-orm");

  const [call] = await db
    .select({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    })
    .from(calls)
    .where(
      and(
        notInArray(calls.status, ["ended", "failed"]),
        or(eq(calls.userId, participantId), eq(calls.otomoId, participantId))
      )
    )
    .limit(1);

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function finalizeCallRecord(
  callId: string,
  payload: {
    endedAt: string;
    durationSeconds: number;
    billedUnits: number;
    billedPoints: number;
  }
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [call] = await db
    .update(calls)
    .set({
      endedAt: new Date(payload.endedAt),
      durationSeconds: payload.durationSeconds,
      billedUnits: payload.billedUnits,
      billedPoints: payload.billedPoints,
      status: "ended",
      endReason: "system_error",
    })
    .where(eq(calls.id, callId))
    .returning({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    });

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function finalizeCallSessionRecord(
  callId: string,
  payload: {
    endedAt: string;
    durationSeconds: number;
    endReason: CallEndReason;
    billedUnits?: number;
    billedPoints?: number;
  }
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const updateData: Record<string, unknown> = {
    endedAt: new Date(payload.endedAt),
    durationSeconds: payload.durationSeconds,
    status: "ended",
    endReason: payload.endReason,
  };

  if (typeof payload.billedUnits === "number") {
    updateData.billedUnits = payload.billedUnits;
  }
  if (typeof payload.billedPoints === "number") {
    updateData.billedPoints = payload.billedPoints;
  }

  const [call] = await db
    .update(calls)
    .set(updateData)
    .where(eq(calls.id, callId))
    .returning({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    });

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function markCallConnectedRecord(
  callId: string,
  connectedAt: string
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [call] = await db
    .update(calls)
    .set({
      connectedAt: new Date(connectedAt),
      startedAt: new Date(connectedAt),
      status: "active",
    })
    .where(eq(calls.id, callId))
    .returning({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    });

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}

export async function updateCallStatusRecord(
  callId: string,
  status: CallStatus
): Promise<CallRecord | null> {
  const { db } = await import("./drizzle.js");
  const { calls } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [call] = await db
    .update(calls)
    .set({ status })
    .where(eq(calls.id, callId))
    .returning({
      callId: calls.id,
      userId: calls.userId,
      otomoId: calls.otomoId,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      connectedAt: calls.connectedAt,
      durationSeconds: calls.durationSeconds,
      billedUnits: calls.billedUnits,
      billedPoints: calls.billedPoints,
      status: calls.status,
      endReason: calls.endReason,
    });

  if (!call) {
    return null;
  }

  return {
    callId: call.callId,
    userId: call.userId,
    otomoId: call.otomoId,
    startedAt: call.startedAt.toISOString(),
    endedAt: call.endedAt?.toISOString() ?? call.startedAt.toISOString(),
    connectedAt: call.connectedAt?.toISOString() ?? null,
    durationSeconds: call.durationSeconds,
    billedUnits: call.billedUnits,
    billedPoints: call.billedPoints,
    status: call.status as CallStatus,
    endReason: call.endReason as CallEndReason | null,
  };
}
