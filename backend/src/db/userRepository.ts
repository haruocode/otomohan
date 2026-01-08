import { randomUUID } from "node:crypto";

export type UserRecord = {
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

type NotificationSettingsRecord = {
  incomingCall: boolean;
  callSummary: boolean;
  walletAlert: boolean;
  marketing: boolean;
};

export async function fetchUserById(id: string): Promise<UserRecord | null> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar_url: users.avatarUrl,
      bio: users.bio,
      gender: users.gender,
      birthday: users.birthday,
      balance: users.balance,
      password_hash: users.passwordHash,
      is_deleted: users.isDeleted,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user || user.is_deleted) {
    return null;
  }

  return {
    ...user,
    gender: user.gender as "male" | "female" | "other" | null,
    birthday: user.birthday?.toISOString().split("T")[0] ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function fetchUserByEmail(
  email: string
): Promise<UserRecord | null> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq, and } = await import("drizzle-orm");

  const normalized = email.trim().toLowerCase();
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar_url: users.avatarUrl,
      bio: users.bio,
      gender: users.gender,
      birthday: users.birthday,
      balance: users.balance,
      password_hash: users.passwordHash,
      is_deleted: users.isDeleted,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.email, normalized), eq(users.isDeleted, false)))
    .limit(1);

  if (!user) {
    return null;
  }

  return {
    ...user,
    gender: user.gender as "male" | "female" | "other" | null,
    birthday: user.birthday?.toISOString().split("T")[0] ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function insertUserRecord(entry: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");

  const id = randomUUID();
  const [user] = await db
    .insert(users)
    .values({
      id,
      name: entry.name,
      email: entry.email.trim().toLowerCase(),
      passwordHash: entry.passwordHash,
      avatarUrl: null,
      bio: "",
      gender: null,
      birthday: null,
      balance: 0,
      isDeleted: false,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar_url: users.avatarUrl,
      bio: users.bio,
      gender: users.gender,
      birthday: users.birthday,
      balance: users.balance,
      password_hash: users.passwordHash,
      is_deleted: users.isDeleted,
      createdAt: users.createdAt,
    });

  return {
    ...user,
    gender: user.gender as "male" | "female" | "other" | null,
    birthday: user.birthday?.toISOString().split("T")[0] ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function fetchUserNotifications(userId: string) {
  const { db } = await import("./drizzle.js");
  const { userNotificationSettings } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [settings] = await db
    .select({
      incomingCall: userNotificationSettings.incomingCall,
      callSummary: userNotificationSettings.callSummary,
      walletAlert: userNotificationSettings.walletAlert,
      marketing: userNotificationSettings.marketing,
    })
    .from(userNotificationSettings)
    .where(eq(userNotificationSettings.userId, userId))
    .limit(1);

  return settings ?? null;
}

export async function updateUserProfileRecord(
  id: string,
  payload: { name?: string; bio?: string | null }
): Promise<Pick<UserRecord, "id" | "name" | "bio"> | null> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const updateData: Record<string, string | null> = {};
  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }
  if (payload.bio !== undefined) {
    updateData.bio = payload.bio;
  }

  if (Object.keys(updateData).length === 0) {
    const [user] = await db
      .select({ id: users.id, name: users.name, bio: users.bio })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  }

  const [user] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning({ id: users.id, name: users.name, bio: users.bio });

  return user ?? null;
}

export async function updateUserAvatarUrl(
  id: string,
  avatarUrl: string
): Promise<{ id: string; avatar_url: string } | null> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [user] = await db
    .update(users)
    .set({ avatarUrl })
    .where(eq(users.id, id))
    .returning({ id: users.id, avatar_url: users.avatarUrl });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    avatar_url: user.avatar_url ?? "",
  };
}

export async function fetchUserPasswordHash(
  id: string
): Promise<string | null> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [user] = await db
    .select({ password_hash: users.passwordHash })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user?.password_hash ?? null;
}

export async function updateUserPasswordHash(
  id: string,
  newHash: string
): Promise<boolean> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const result = await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, id));

  return result.rowCount ? result.rowCount > 0 : false;
}

export async function softDeleteUserRecord(
  id: string
): Promise<"not_found" | "already_deleted" | "success"> {
  const { db } = await import("./drizzle.js");
  const { users } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  const [user] = await db
    .select({ isDeleted: users.isDeleted })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) return "not_found";
  if (user.isDeleted) return "already_deleted";

  await db
    .update(users)
    .set({
      isDeleted: true,
      name: "退会ユーザー",
      avatarUrl: null,
      bio: null,
      gender: null,
      birthday: null,
    })
    .where(eq(users.id, id));

  return "success";
}

export async function deleteUserSettingsRecord(id: string): Promise<void> {
  const { db } = await import("./drizzle.js");
  const { userNotificationSettings } = await import("./schema/index.js");
  const { eq } = await import("drizzle-orm");

  await db
    .delete(userNotificationSettings)
    .where(eq(userNotificationSettings.userId, id));
}

export async function saveUserNotificationsRecord(
  userId: string,
  notifications: NotificationSettingsRecord
) {
  const { db } = await import("./drizzle.js");
  const { userNotificationSettings } = await import("./schema/index.js");

  const [settings] = await db
    .insert(userNotificationSettings)
    .values({
      userId,
      incomingCall: notifications.incomingCall,
      callSummary: notifications.callSummary,
      walletAlert: notifications.walletAlert,
      marketing: notifications.marketing,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userNotificationSettings.userId,
      set: {
        incomingCall: notifications.incomingCall,
        callSummary: notifications.callSummary,
        walletAlert: notifications.walletAlert,
        marketing: notifications.marketing,
        updatedAt: new Date(),
      },
    })
    .returning({
      incomingCall: userNotificationSettings.incomingCall,
      callSummary: userNotificationSettings.callSummary,
      walletAlert: userNotificationSettings.walletAlert,
      marketing: userNotificationSettings.marketing,
    });

  return settings;
}
