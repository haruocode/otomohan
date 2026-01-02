import { randomUUID } from "node:crypto";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  gender: "male" | "female" | "other" | null;
  birthday: string | null;
  balance: number;
  password_hash: string;
  is_deleted: boolean;
  createdAt: string;
};

type OtomoReviewRecord = {
  reviewId: string;
  userDisplayName: string;
  score: number;
  comment: string;
  createdAt: string;
};

type OtomoScheduleRecord = {
  dayOfWeek:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  start: string;
  end: string;
};

type OtomoRecord = {
  otomoId: string;
  ownerUserId: string;
  displayName: string;
  profileImageUrl: string;
  age: number;
  gender: "female" | "male" | "other";
  genres: string[];
  introduction: string;
  tags: string[];
  isOnline: boolean;
  isAvailable: boolean;
  statusMessage: string | null;
  statusUpdatedAt: string;
  pricePerMinute: number;
  rating: number;
  reviewCount: number;
  reviews: OtomoReviewRecord[];
  schedule: OtomoScheduleRecord[];
};

type NotificationSettingsRecord = {
  incomingCall: boolean;
  callSummary: boolean;
  walletAlert: boolean;
  marketing: boolean;
};

type WalletRecord = {
  userId: string;
  balance: number;
  updatedAt: string;
};

type WalletPlanRecord = {
  planId: string;
  title: string;
  price: number;
  points: number;
  bonusPoints: number;
  description: string;
  isActive: boolean;
};

type WalletHistoryRecord = {
  historyId: string;
  userId: string;
  planId: string;
  paymentId: string;
  amount: number;
  points: number;
  bonusPoints: number;
  createdAt: string;
};

type WalletHistoryViewRecord = WalletHistoryRecord & {
  planTitle: string;
};

type WalletUsageRecord = {
  usageId: string;
  userId: string;
  callId: string;
  otomoId: string;
  usedPoints: number;
  durationMinutes: number;
  createdAt: string;
};

type WalletUsageViewRecord = WalletUsageRecord & {
  otomoName: string;
};

export type CallStatus =
  | "requesting"
  | "ringing"
  | "accepted"
  | "active"
  | "rejected"
  | "ended";

export type CallEndReason =
  | "rtp_stopped"
  | "disconnect"
  | "low_balance"
  | "manual";

type CallRecord = {
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

type CallBillingUnitRecord = {
  unitId: string;
  callId: string;
  minuteIndex: number;
  chargedPoints: number;
  timestamp: string;
};

type RefreshTokenRecord = {
  token: string;
  userId: string;
  expiresAt: string;
};

const usersTable: Record<string, UserRecord> = {
  "user-123": {
    id: "user-123",
    name: "たろう",
    email: "taro@example.com",
    avatar_url: "/avatars/user-123.png",
    bio: "よろしくお願いします！",
    gender: "male",
    birthday: "1995-03-10",
    balance: 1200,
    password_hash:
      "$2b$10$r5g2bHujNKJMkBz7OpHSxO/XrXhsat1qNvrcvxKl6nQe.iTMfPCY2",
    is_deleted: false,
    createdAt: "2024-12-01T12:00:00Z",
  },
};

const otomoTable: OtomoRecord[] = [
  {
    otomoId: "otomo_001",
    ownerUserId: "otomo-user-001",
    displayName: "みさき",
    profileImageUrl: "https://cdn.otomohan.local/otomo/001.jpg",
    age: 25,
    gender: "female",
    genres: ["healing", "talk", "consult"],
    introduction: "はじめまして、みさきです。のんびりお話ししましょう。",
    tags: ["癒し系", "傾聴", "お姉さんタイプ"],
    isOnline: true,
    isAvailable: true,
    statusMessage: "待機中です！",
    statusUpdatedAt: "2025-01-10T11:00:00Z",
    pricePerMinute: 120,
    rating: 4.8,
    reviewCount: 54,
    reviews: [
      {
        reviewId: "rev_001",
        userDisplayName: "たかはるさん",
        score: 5,
        comment: "優しく話を聞いてくれました！",
        createdAt: "2025-01-10T12:00:00Z",
      },
      {
        reviewId: "rev_002",
        userDisplayName: "まゆさん",
        score: 4,
        comment: "癒やされました。またお願いしたいです。",
        createdAt: "2025-01-05T15:00:00Z",
      },
    ],
    schedule: [
      { dayOfWeek: "monday", start: "20:00", end: "23:00" },
      { dayOfWeek: "tuesday", start: "21:00", end: "22:00" },
      { dayOfWeek: "thursday", start: "20:00", end: "23:00" },
    ],
  },
  {
    otomoId: "otomo_002",
    ownerUserId: "otomo-user-002",
    displayName: "ゆうと",
    profileImageUrl: "https://cdn.otomohan.local/otomo/002.jpg",
    age: 28,
    gender: "male",
    genres: ["consult", "advice"],
    introduction: "キャリア相談や愚痴聞きもお任せください。",
    tags: ["論理的", "相談役"],
    isOnline: false,
    isAvailable: false,
    statusMessage: "休憩中です",
    statusUpdatedAt: "2025-01-12T09:00:00Z",
    pricePerMinute: 100,
    rating: 4.5,
    reviewCount: 30,
    reviews: [
      {
        reviewId: "rev_010",
        userDisplayName: "しゅん",
        score: 5,
        comment: "的確なアドバイスで助かりました。",
        createdAt: "2025-02-12T10:00:00Z",
      },
    ],
    schedule: [
      { dayOfWeek: "wednesday", start: "19:00", end: "22:00" },
      { dayOfWeek: "saturday", start: "10:00", end: "15:00" },
    ],
  },
  {
    otomoId: "otomo_003",
    ownerUserId: "otomo-user-003",
    displayName: "さくら",
    profileImageUrl: "https://cdn.otomohan.local/otomo/003.jpg",
    age: 32,
    gender: "female",
    genres: ["talk", "support"],
    introduction: "聞き上手とよく言われます。安心してお話ください。",
    tags: ["サポート", "落ち着き"],
    isOnline: true,
    isAvailable: false,
    statusMessage: "通話中です",
    statusUpdatedAt: "2025-01-13T20:30:00Z",
    pricePerMinute: 140,
    rating: 4.9,
    reviewCount: 120,
    reviews: [
      {
        reviewId: "rev_020",
        userDisplayName: "みか",
        score: 5,
        comment: "落ち着いた雰囲気で癒やされました。",
        createdAt: "2025-03-01T08:30:00Z",
      },
    ],
    schedule: [
      { dayOfWeek: "friday", start: "21:00", end: "24:00" },
      { dayOfWeek: "sunday", start: "18:00", end: "21:00" },
    ],
  },
];

const userSettingsTable: Record<
  string,
  {
    notifications: NotificationSettingsRecord;
  }
> = {
  "user-123": {
    notifications: {
      incomingCall: true,
      callSummary: true,
      walletAlert: true,
      marketing: false,
    },
  },
};

const walletTable: Record<string, WalletRecord> = {
  "user-123": {
    userId: "user-123",
    balance: 1200,
    updatedAt: "2025-01-15T12:00:00Z",
  },
};

const walletPlansTable: WalletPlanRecord[] = [
  {
    planId: "plan_001",
    title: "お手軽チャージ",
    price: 500,
    points: 500,
    bonusPoints: 0,
    description: "気軽にチャージできる入門プラン",
    isActive: true,
  },
  {
    planId: "plan_002",
    title: "おすすめプラン",
    price: 1000,
    points: 1000,
    bonusPoints: 100,
    description: "ちょっとお得なボーナス付きプラン",
    isActive: true,
  },
  {
    planId: "plan_003",
    title: "たっぷりプラン",
    price: 3000,
    points: 3000,
    bonusPoints: 500,
    description: "長く話したい人におすすめの大容量プラン",
    isActive: true,
  },
];

const walletHistoryTable: WalletHistoryRecord[] = [];
const walletUsageTable: WalletUsageRecord[] = [
  {
    usageId: "usage_001",
    userId: "user-123",
    callId: "call_20250115_01",
    otomoId: "otomo_001",
    usedPoints: 240,
    durationMinutes: 2,
    createdAt: "2025-01-15T12:00:00Z",
  },
  {
    usageId: "usage_002",
    userId: "user-123",
    callId: "call_20250116_01",
    otomoId: "otomo_002",
    usedPoints: 360,
    durationMinutes: 3,
    createdAt: "2025-01-16T10:30:00Z",
  },
  {
    usageId: "usage_003",
    userId: "user-123",
    callId: "call_20250118_01",
    otomoId: "otomo_003",
    usedPoints: 420,
    durationMinutes: 3,
    createdAt: "2025-01-18T21:45:00Z",
  },
];

const callHistoryTable: CallRecord[] = [
  {
    callId: "call_20250110_001",
    userId: "user-123",
    otomoId: "otomo_001",
    startedAt: "2025-01-10T12:03:20Z",
    endedAt: "2025-01-10T12:15:20Z",
    connectedAt: "2025-01-10T12:03:20Z",
    durationSeconds: 720,
    billedUnits: 12,
    billedPoints: 1200,
    status: "ended",
    endReason: "manual",
  },
  {
    callId: "call_20250112_002",
    userId: "user-123",
    otomoId: "otomo_002",
    startedAt: "2025-01-12T21:00:00Z",
    endedAt: "2025-01-12T21:18:00Z",
    connectedAt: "2025-01-12T21:00:00Z",
    durationSeconds: 1080,
    billedUnits: 18,
    billedPoints: 1800,
    status: "ended",
    endReason: "manual",
  },
  {
    callId: "call_20250115_003",
    userId: "user-123",
    otomoId: "otomo_003",
    startedAt: "2025-01-15T09:30:00Z",
    endedAt: "2025-01-15T09:40:00Z",
    connectedAt: "2025-01-15T09:30:00Z",
    durationSeconds: 600,
    billedUnits: 10,
    billedPoints: 1000,
    status: "ended",
    endReason: "manual",
  },
];

const callBillingUnitsTable: CallBillingUnitRecord[] = [
  {
    unitId: "unit_call_20250110_001_00",
    callId: "call_20250110_001",
    minuteIndex: 0,
    chargedPoints: 100,
    timestamp: "2025-01-10T12:04:20Z",
  },
  {
    unitId: "unit_call_20250110_001_01",
    callId: "call_20250110_001",
    minuteIndex: 1,
    chargedPoints: 100,
    timestamp: "2025-01-10T12:05:20Z",
  },
  {
    unitId: "unit_call_20250110_001_11",
    callId: "call_20250110_001",
    minuteIndex: 11,
    chargedPoints: 100,
    timestamp: "2025-01-10T12:15:20Z",
  },
  {
    unitId: "unit_call_20250112_002_00",
    callId: "call_20250112_002",
    minuteIndex: 0,
    chargedPoints: 100,
    timestamp: "2025-01-12T21:01:00Z",
  },
  {
    unitId: "unit_call_20250112_002_05",
    callId: "call_20250112_002",
    minuteIndex: 5,
    chargedPoints: 100,
    timestamp: "2025-01-12T21:06:00Z",
  },
  {
    unitId: "unit_call_20250112_002_17",
    callId: "call_20250112_002",
    minuteIndex: 17,
    chargedPoints: 100,
    timestamp: "2025-01-12T21:18:00Z",
  },
  {
    unitId: "unit_call_20250115_003_00",
    callId: "call_20250115_003",
    minuteIndex: 0,
    chargedPoints: 100,
    timestamp: "2025-01-15T09:31:00Z",
  },
  {
    unitId: "unit_call_20250115_003_05",
    callId: "call_20250115_003",
    minuteIndex: 5,
    chargedPoints: 100,
    timestamp: "2025-01-15T09:36:00Z",
  },
  {
    unitId: "unit_call_20250115_003_09",
    callId: "call_20250115_003",
    minuteIndex: 9,
    chargedPoints: 100,
    timestamp: "2025-01-15T09:40:00Z",
  },
];

const refreshTokenTable: RefreshTokenRecord[] = [];

export async function upsertRefreshTokenRecord(entry: {
  userId: string;
  token: string;
  expiresAt: string;
}): Promise<RefreshTokenRecord> {
  const existingIndex = refreshTokenTable.findIndex(
    (record) => record.userId === entry.userId
  );
  if (existingIndex !== -1) {
    refreshTokenTable.splice(existingIndex, 1);
  }
  const record: RefreshTokenRecord = { ...entry };
  refreshTokenTable.push(record);
  return record;
}

export async function fetchRefreshTokenRecord(
  token: string
): Promise<RefreshTokenRecord | null> {
  return refreshTokenTable.find((record) => record.token === token) ?? null;
}

export async function fetchUserById(id: string): Promise<UserRecord | null> {
  const record = usersTable[id];
  if (!record || record.is_deleted) {
    return null;
  }
  return record;
}

export async function fetchUserByEmail(
  email: string
): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  const record = Object.values(usersTable).find(
    (entry) => entry.email === normalized && !entry.is_deleted
  );
  return record ?? null;
}

export async function insertUserRecord(entry: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const record: UserRecord = {
    id,
    name: entry.name,
    email: entry.email.trim().toLowerCase(),
    avatar_url: null,
    bio: "",
    gender: null,
    birthday: null,
    balance: 0,
    password_hash: entry.passwordHash,
    is_deleted: false,
    createdAt: now,
  };

  usersTable[id] = record;
  return record;
}

export async function fetchUserNotifications(userId: string) {
  return userSettingsTable[userId]?.notifications ?? null;
}

export async function fetchWalletByUserId(
  userId: string
): Promise<WalletRecord | null> {
  return walletTable[userId] ?? null;
}

export async function fetchActiveWalletPlans(): Promise<WalletPlanRecord[]> {
  return walletPlansTable
    .filter((plan) => plan.isActive)
    .sort((a, b) => {
      if (a.price === b.price) {
        return a.planId.localeCompare(b.planId);
      }
      return a.price - b.price;
    });
}

export async function fetchWalletPlanById(
  planId: string
): Promise<WalletPlanRecord | null> {
  const plan = walletPlansTable.find(
    (entry) => entry.planId === planId && entry.isActive
  );
  return plan ?? null;
}

export async function incrementWalletBalanceRecord(
  userId: string,
  deltaPoints: number
): Promise<WalletRecord> {
  const now = new Date().toISOString();
  let wallet = walletTable[userId];
  if (!wallet) {
    wallet = {
      userId,
      balance: 0,
      updatedAt: now,
    };
  }

  wallet.balance += deltaPoints;
  wallet.updatedAt = now;
  walletTable[userId] = wallet;

  const userRecord = usersTable[userId];
  if (userRecord) {
    userRecord.balance = wallet.balance;
  }

  return wallet;
}

export async function isPaymentAlreadyProcessed(paymentId: string) {
  return walletHistoryTable.some((record) => record.paymentId === paymentId);
}

export async function insertWalletHistoryRecord(entry: {
  userId: string;
  planId: string;
  paymentId: string;
  amount: number;
  points: number;
  bonusPoints: number;
}): Promise<WalletHistoryRecord> {
  const record: WalletHistoryRecord = {
    historyId: randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
  };

  walletHistoryTable.push(record);
  return record;
}

export async function fetchWalletHistoryForUser(options: {
  userId: string;
  limit: number;
  offset: number;
  sort: "newest" | "oldest";
}): Promise<{ items: WalletHistoryViewRecord[]; total: number }> {
  const { userId, limit, offset, sort } = options;
  const records = walletHistoryTable.filter((entry) => entry.userId === userId);
  const total = records.length;
  const sorted = [...records].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  });

  const safeOffset = Math.max(offset, 0);
  const safeLimit = Math.max(limit, 0);
  const paged = sorted.slice(safeOffset, safeOffset + safeLimit);

  const planTitleMap = new Map(
    walletPlansTable.map((plan) => [plan.planId, plan.title])
  );

  const items = paged.map((record) => ({
    ...record,
    planTitle: planTitleMap.get(record.planId) ?? "不明なプラン",
  }));

  return { items, total };
}

export async function fetchWalletUsageForUser(options: {
  userId: string;
  limit: number;
  offset: number;
  sort: "newest" | "oldest";
  otomoId?: string;
}): Promise<{ items: WalletUsageViewRecord[]; total: number }> {
  const { userId, limit, offset, sort, otomoId } = options;
  let records = walletUsageTable.filter((entry) => entry.userId === userId);
  if (otomoId) {
    records = records.filter((entry) => entry.otomoId === otomoId);
  }

  const total = records.length;
  const sorted = [...records].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  });

  const safeOffset = Math.max(offset, 0);
  const safeLimit = Math.max(limit, 0);
  const paged = sorted.slice(safeOffset, safeOffset + safeLimit);

  const otomoNameMap = new Map(
    otomoTable.map((otomo) => [otomo.otomoId, otomo.displayName])
  );

  const items = paged.map((record) => ({
    ...record,
    otomoName: otomoNameMap.get(record.otomoId) ?? "不明なおとも",
  }));

  return { items, total };
}

export async function fetchCallsForParticipant(options: {
  participantId: string;
  participantType: "user" | "otomo";
  limit: number;
  offset: number;
}): Promise<{ items: CallRecord[]; total: number }> {
  const safeLimit = Math.max(options.limit, 0);
  const safeOffset = Math.max(options.offset, 0);
  const filtered = callHistoryTable.filter((record) =>
    options.participantType === "user"
      ? record.userId === options.participantId
      : record.otomoId === options.participantId
  );
  const total = filtered.length;
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
  const items = sorted.slice(safeOffset, safeOffset + safeLimit);
  return { items, total };
}

export async function fetchCallById(
  callId: string
): Promise<CallRecord | null> {
  return callHistoryTable.find((record) => record.callId === callId) ?? null;
}

export async function fetchCallBillingUnits(
  callId: string
): Promise<CallBillingUnitRecord[]> {
  return callBillingUnitsTable
    .filter((unit) => unit.callId === callId)
    .sort((a, b) => a.minuteIndex - b.minuteIndex);
}

export async function insertCallBillingUnitRecord(entry: {
  callId: string;
  minuteIndex: number;
  chargedPoints: number;
  timestamp: string;
}): Promise<CallBillingUnitRecord> {
  const record: CallBillingUnitRecord = {
    unitId: randomUUID(),
    callId: entry.callId,
    minuteIndex: entry.minuteIndex,
    chargedPoints: entry.chargedPoints,
    timestamp: entry.timestamp,
  };
  callBillingUnitsTable.push(record);
  return record;
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
  const record = callHistoryTable.find((entry) => entry.callId === callId);
  if (!record) {
    return null;
  }

  record.billedUnits = Math.max(record.billedUnits, payload.billedUnits);
  record.billedPoints += payload.billedPointsDelta;
  record.durationSeconds = Math.max(
    record.durationSeconds,
    payload.durationSeconds
  );
  record.endedAt = payload.endedAt;

  return record;
}

export async function insertCallRequestRecord(entry: {
  callId: string;
  userId: string;
  otomoId: string;
  startedAt?: string;
}): Promise<CallRecord> {
  const now = entry.startedAt ?? new Date().toISOString();
  const record: CallRecord = {
    callId: entry.callId,
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
  };

  callHistoryTable.push(record);
  return record;
}

export async function findActiveCallForParticipant(
  participantId: string
): Promise<CallRecord | null> {
  return (
    callHistoryTable.find(
      (record) =>
        record.status !== "ended" &&
        record.status !== "rejected" &&
        (record.userId === participantId || record.otomoId === participantId)
    ) ?? null
  );
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
  const record = callHistoryTable.find((entry) => entry.callId === callId);
  if (!record) {
    return null;
  }

  record.endedAt = payload.endedAt;
  record.durationSeconds = payload.durationSeconds;
  record.billedUnits = payload.billedUnits;
  record.billedPoints = payload.billedPoints;
  record.status = "ended";
  record.endReason = "manual";

  return record;
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
  const record = callHistoryTable.find((entry) => entry.callId === callId);
  if (!record) {
    return null;
  }

  record.endedAt = payload.endedAt;
  record.durationSeconds = payload.durationSeconds;
  record.status = "ended";
  record.endReason = payload.endReason;
  if (typeof payload.billedUnits === "number") {
    record.billedUnits = payload.billedUnits;
  }
  if (typeof payload.billedPoints === "number") {
    record.billedPoints = payload.billedPoints;
  }

  return record;
}

export async function markCallConnectedRecord(
  callId: string,
  connectedAt: string
): Promise<CallRecord | null> {
  const record = callHistoryTable.find((entry) => entry.callId === callId);
  if (!record) {
    return null;
  }

  record.connectedAt = connectedAt;
  record.startedAt = connectedAt;
  record.status = "active";
  return record;
}

export async function updateCallStatusRecord(
  callId: string,
  status: CallStatus
): Promise<CallRecord | null> {
  const record = callHistoryTable.find((entry) => entry.callId === callId);
  if (!record) {
    return null;
  }

  record.status = status;
  return record;
}

export async function saveUserNotificationsRecord(
  userId: string,
  notifications: NotificationSettingsRecord
) {
  userSettingsTable[userId] = {
    notifications: { ...notifications },
  };
  return userSettingsTable[userId].notifications;
}

export async function updateUserProfileRecord(
  id: string,
  payload: { name?: string; bio?: string | null }
): Promise<Pick<UserRecord, "id" | "name" | "bio"> | null> {
  const record = usersTable[id];
  if (!record) return null;

  if (payload.name !== undefined) {
    record.name = payload.name;
  }
  if (payload.bio !== undefined) {
    record.bio = payload.bio;
  }

  return { id: record.id, name: record.name, bio: record.bio };
}

export async function updateUserAvatarUrl(
  id: string,
  avatarUrl: string
): Promise<{ id: string; avatar_url: string } | null> {
  const record = usersTable[id];
  if (!record) return null;
  record.avatar_url = avatarUrl;
  return { id: record.id, avatar_url: record.avatar_url };
}

export async function fetchUserPasswordHash(
  id: string
): Promise<string | null> {
  return usersTable[id]?.password_hash ?? null;
}

export async function updateUserPasswordHash(
  id: string,
  newHash: string
): Promise<boolean> {
  const record = usersTable[id];
  if (!record) return false;
  record.password_hash = newHash;
  return true;
}

export async function softDeleteUserRecord(
  id: string
): Promise<"not_found" | "already_deleted" | "success"> {
  const record = usersTable[id];
  if (!record) return "not_found";
  if (record.is_deleted) return "already_deleted";

  record.is_deleted = true;
  record.name = "退会ユーザー";
  record.avatar_url = null;
  record.bio = null;
  record.gender = null;
  record.birthday = null;

  return "success";
}

export async function deleteUserSettingsRecord(id: string): Promise<void> {
  delete userSettingsTable[id];
}

export type OtomoListFilters = {
  isOnline?: boolean;
  genre?: string;
  minAge?: number;
  maxAge?: number;
  limit: number;
  offset: number;
};

export type OtomoReviewFilters = {
  limit: number;
  offset: number;
  sort: "newest" | "highest" | "lowest";
};

export async function fetchOtomoList(filters: OtomoListFilters) {
  let filtered = otomoTable;

  if (typeof filters.isOnline === "boolean") {
    filtered = filtered.filter(
      (record) => record.isOnline === filters.isOnline
    );
  }

  if (filters.genre) {
    filtered = filtered.filter((record) =>
      record.genres.includes(filters.genre as string)
    );
  }

  if (typeof filters.minAge === "number") {
    filtered = filtered.filter((record) => record.age >= filters.minAge!);
  }

  if (typeof filters.maxAge === "number") {
    filtered = filtered.filter((record) => record.age <= filters.maxAge!);
  }

  const total = filtered.length;
  const start = Math.max(filters.offset, 0);
  const end = start + Math.max(filters.limit, 0);
  const items = filtered.slice(start, end);

  return {
    items,
    total,
  };
}

export async function fetchOtomoById(
  otomoId: string
): Promise<OtomoRecord | null> {
  return otomoTable.find((record) => record.otomoId === otomoId) ?? null;
}

export async function fetchOtomoByOwnerUserId(
  ownerUserId: string
): Promise<OtomoRecord | null> {
  return (
    otomoTable.find((record) => record.ownerUserId === ownerUserId) ?? null
  );
}

export async function updateOtomoStatusRecord(
  otomoId: string,
  payload: {
    isOnline: boolean;
    isAvailable: boolean;
    statusMessage: string | null;
    statusUpdatedAt: string;
  }
): Promise<{
  otomoId: string;
  isOnline: boolean;
  isAvailable: boolean;
  statusMessage: string | null;
  statusUpdatedAt: string;
} | null> {
  const record = otomoTable.find((entry) => entry.otomoId === otomoId);
  if (!record) {
    return null;
  }

  record.isOnline = payload.isOnline;
  record.isAvailable = payload.isAvailable;
  record.statusMessage = payload.statusMessage;
  record.statusUpdatedAt = payload.statusUpdatedAt;

  return {
    otomoId: record.otomoId,
    isOnline: record.isOnline,
    isAvailable: record.isAvailable,
    statusMessage: record.statusMessage,
    statusUpdatedAt: record.statusUpdatedAt,
  };
}

export async function fetchOtomoReviews(
  otomoId: string,
  filters: OtomoReviewFilters
): Promise<{ items: OtomoReviewRecord[]; total: number } | null> {
  const record = otomoTable.find((entry) => entry.otomoId === otomoId);
  if (!record) {
    return null;
  }

  let reviews = [...record.reviews];
  reviews = sortReviews(reviews, filters.sort);

  const total = reviews.length;
  const start = Math.max(filters.offset, 0);
  const end = start + Math.max(filters.limit, 0);
  const items = reviews.slice(start, end);

  return { items, total };
}

function sortReviews(
  reviews: OtomoReviewRecord[],
  sort: "newest" | "highest" | "lowest"
) {
  if (sort === "highest") {
    return reviews.sort((a, b) => {
      if (b.score === a.score) {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return b.score - a.score;
    });
  }
  if (sort === "lowest") {
    return reviews.sort((a, b) => {
      if (a.score === b.score) {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return a.score - b.score;
    });
  }

  return reviews.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
