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

const userSettingsTable: Record<
  string,
  {
    notifications: {
      incomingCall: boolean;
      callSummary: boolean;
      walletAlert: boolean;
      marketing: boolean;
    };
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
