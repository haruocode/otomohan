type UserRecord = {
  id: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  gender: "male" | "female" | "other" | null;
  birthday: string | null;
  balance: number;
  password_hash: string;
  is_deleted: boolean;
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

const usersTable: Record<string, UserRecord> = {
  "user-123": {
    id: "user-123",
    name: "たろう",
    avatar_url: "/avatars/user-123.png",
    bio: "よろしくお願いします！",
    gender: "male",
    birthday: "1995-03-10",
    balance: 1200,
    password_hash:
      "$2b$10$r5g2bHujNKJMkBz7OpHSxO/XrXhsat1qNvrcvxKl6nQe.iTMfPCY2",
    is_deleted: false,
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

export async function fetchUserById(id: string): Promise<UserRecord | null> {
  const record = usersTable[id];
  if (!record || record.is_deleted) {
    return null;
  }
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
  record.avatar_url = "";
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
