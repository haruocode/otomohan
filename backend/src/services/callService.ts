import {
  listCallsForAccount,
  getCallById,
  listCallBillingUnits,
} from "../repositories/callRepository.js";
import { getUserById } from "../repositories/userRepository.js";
import { findOtomoById } from "../repositories/otomoRepository.js";

export type CallHistoryItem = {
  callId: string;
  withUser: {
    id: string;
    name: string;
    avatar: string | null;
  };
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  billedUnits: number;
  billedPoints: number;
};

export type CallHistoryResult = {
  calls: CallHistoryItem[];
  total: number;
};

export type CallBillingUnit = {
  minute: number;
  chargedPoints: number;
  timestamp: string;
};

export type CallDetail = CallHistoryItem & {
  billingUnits: CallBillingUnit[];
};

export type CallDetailResult =
  | { success: true; call: CallDetail }
  | { success: false; reason: "CALL_NOT_FOUND" | "FORBIDDEN" };

export type CallBillingUnitsResult =
  | { success: true; callId: string; billingUnits: CallBillingUnit[] }
  | { success: false; reason: "CALL_NOT_FOUND" | "FORBIDDEN" };

export async function listCallHistoryForAccount(options: {
  accountId: string;
  role: "user" | "otomo";
  limit: number;
  offset: number;
}): Promise<CallHistoryResult> {
  const listing = await listCallsForAccount({
    accountId: options.accountId,
    role: options.role,
    limit: options.limit,
    offset: options.offset,
  });

  if (listing.items.length === 0) {
    return { calls: [], total: listing.total };
  }

  if (options.role === "user") {
    const otomoMap = await buildOtomoMap(
      listing.items.map((item) => item.otomoId)
    );
    return {
      total: listing.total,
      calls: listing.items.map((call) => ({
        callId: call.callId,
        withUser: otomoMap.get(call.otomoId) ?? {
          id: call.otomoId,
          name: "不明なおとも",
          avatar: null,
        },
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        durationSeconds: call.durationSeconds,
        billedUnits: call.billedUnits,
        billedPoints: call.billedPoints,
      })),
    };
  }

  const userMap = await buildUserMap(listing.items.map((item) => item.userId));
  return {
    total: listing.total,
    calls: listing.items.map((call) => ({
      callId: call.callId,
      withUser: userMap.get(call.userId) ?? {
        id: call.userId,
        name: "不明なユーザー",
        avatar: null,
      },
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      durationSeconds: call.durationSeconds,
      billedUnits: call.billedUnits,
      billedPoints: call.billedPoints,
    })),
  };
}

async function buildOtomoMap(ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  const entries = await Promise.all(uniqueIds.map((id) => findOtomoById(id)));
  return new Map(
    entries
      .map((otomo, index) => {
        if (!otomo) return null;
        return [
          uniqueIds[index],
          {
            id: otomo.otomoId,
            name: otomo.displayName,
            avatar: otomo.profileImageUrl,
          },
        ] as const;
      })
      .filter(
        (
          entry
        ): entry is [
          string,
          { id: string; name: string; avatar: string | null }
        ] => Boolean(entry)
      )
  );
}

async function buildUserMap(ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  const entries = await Promise.all(uniqueIds.map((id) => getUserById(id)));
  return new Map(
    entries
      .map((user, index) => {
        if (!user) return null;
        return [
          uniqueIds[index],
          { id: user.id, name: user.name, avatar: user.avatar_url },
        ] as const;
      })
      .filter(
        (
          entry
        ): entry is [
          string,
          { id: string; name: string; avatar: string | null }
        ] => Boolean(entry)
      )
  );
}

export async function getCallDetailForAccount(options: {
  callId: string;
  accountId: string;
  role: "user" | "otomo";
}): Promise<CallDetailResult> {
  const call = await getCallById(options.callId);
  if (!call) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  const isParticipant =
    call.userId === options.accountId || call.otomoId === options.accountId;
  if (!isParticipant) {
    return { success: false, reason: "FORBIDDEN" };
  }
  const billingUnits = await listCallBillingUnits(call.callId);

  return {
    success: true,
    call: {
      callId: call.callId,
      withUser:
        call.userId === options.accountId
          ? await resolveOtomoProfile(call.otomoId)
          : await resolveUserProfile(call.userId),
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      durationSeconds: call.durationSeconds,
      billedUnits: call.billedUnits,
      billedPoints: call.billedPoints,
      billingUnits: billingUnits.map((unit) => ({
        minute: unit.minuteIndex,
        chargedPoints: unit.chargedPoints,
        timestamp: unit.timestamp,
      })),
    },
  };
}

export async function getCallBillingUnitsForAccount(options: {
  callId: string;
  accountId: string;
}): Promise<CallBillingUnitsResult> {
  const call = await getCallById(options.callId);
  if (!call) {
    return { success: false, reason: "CALL_NOT_FOUND" };
  }

  const isParticipant =
    call.userId === options.accountId || call.otomoId === options.accountId;
  if (!isParticipant) {
    return { success: false, reason: "FORBIDDEN" };
  }

  const billingUnits = await listCallBillingUnits(call.callId);
  return {
    success: true,
    callId: call.callId,
    billingUnits: billingUnits.map((unit) => ({
      minute: unit.minuteIndex,
      chargedPoints: unit.chargedPoints,
      timestamp: unit.timestamp,
    })),
  };
}

async function resolveOtomoProfile(otomoId: string) {
  const otomo = await findOtomoById(otomoId);
  if (!otomo) {
    return {
      id: otomoId,
      name: "不明なおとも",
      avatar: null,
    };
  }

  return {
    id: otomo.otomoId,
    name: otomo.displayName,
    avatar: otomo.profileImageUrl,
  };
}

async function resolveUserProfile(userId: string) {
  const user = await getUserById(userId);
  if (!user) {
    return {
      id: userId,
      name: "不明なユーザー",
      avatar: null,
    };
  }

  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar_url,
  };
}
