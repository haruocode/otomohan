import { listCallsForAccount } from "../repositories/callRepository.js";
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
