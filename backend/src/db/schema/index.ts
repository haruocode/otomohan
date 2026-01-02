import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  numeric,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  gender: varchar("gender", { length: 16 }),
  birthday: dateColumn("birthday"),
  balance: integer("balance").default(0).notNull(),
  passwordHash: text("password_hash").notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const otomoProfiles = pgTable("otomo_profiles", {
  id: varchar("otomo_id", { length: 64 }).primaryKey(),
  ownerUserId: varchar("owner_user_id", { length: 64 })
    .notNull()
    .references(() => users.id),
  displayName: text("display_name").notNull(),
  profileImageUrl: text("profile_image_url"),
  age: integer("age"),
  gender: varchar("gender", { length: 16 }),
  introduction: text("introduction"),
  tags: text("tags").array(),
  genres: text("genres").array(),
  statusMessage: text("status_message"),
  isOnline: boolean("is_online").default(false).notNull(),
  isAvailable: boolean("is_available").default(false).notNull(),
  pricePerMinute: integer("price_per_minute").default(120).notNull(),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0").notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  statusUpdatedAt: timestamp("status_updated_at").defaultNow().notNull(),
  schedule: jsonb("schedule").$type<ScheduleSlot[]>().default([]).notNull(),
});

export const userNotificationSettings = pgTable("user_notification_settings", {
  userId: varchar("user_id", { length: 64 })
    .primaryKey()
    .references(() => users.id),
  incomingCall: boolean("incoming_call").default(true).notNull(),
  callSummary: boolean("call_summary").default(true).notNull(),
  walletAlert: boolean("wallet_alert").default(true).notNull(),
  marketing: boolean("marketing").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const walletPlans = pgTable("wallet_plans", {
  id: varchar("plan_id", { length: 64 }).primaryKey(),
  title: text("title").notNull(),
  priceYen: integer("price_yen").notNull(),
  points: integer("points").notNull(),
  bonusPoints: integer("bonus_points").default(0).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const walletBalances = pgTable("wallet_balances", {
  userId: varchar("user_id", { length: 64 })
    .primaryKey()
    .references(() => users.id),
  balance: integer("balance").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const walletCharges = pgTable("wallet_charges", {
  id: uuid("charge_id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 64 })
    .notNull()
    .references(() => users.id),
  planId: varchar("plan_id", { length: 64 }).references(() => walletPlans.id),
  paymentId: text("payment_id"),
  amountYen: integer("amount_yen").notNull(),
  grantedPoints: integer("granted_points").notNull(),
  bonusPoints: integer("bonus_points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const walletUsages = pgTable("wallet_usages", {
  id: uuid("usage_id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 64 })
    .notNull()
    .references(() => users.id),
  callId: varchar("call_id", { length: 64 }).notNull(),
  otomoId: varchar("otomo_id", { length: 64 })
    .notNull()
    .references(() => otomoProfiles.id),
  usedPoints: integer("used_points").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calls = pgTable("calls", {
  id: varchar("call_id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 })
    .notNull()
    .references(() => users.id),
  otomoId: varchar("otomo_id", { length: 64 })
    .notNull()
    .references(() => otomoProfiles.id),
  startedAt: timestamp("started_at").notNull(),
  connectedAt: timestamp("connected_at"),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds").default(0).notNull(),
  billedUnits: integer("billed_units").default(0).notNull(),
  billedPoints: integer("billed_points").default(0).notNull(),
  status: varchar("status", { length: 32 }).default("requesting").notNull(),
  endReason: varchar("end_reason", { length: 32 }),
});

export const callBillingUnits = pgTable("call_billing_units", {
  id: uuid("unit_id").defaultRandom().primaryKey(),
  callId: varchar("call_id", { length: 64 })
    .notNull()
    .references(() => calls.id, { onDelete: "cascade" }),
  minuteIndex: integer("minute_index").notNull(),
  chargedPoints: integer("charged_points").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  token: text("token").primaryKey(),
  userId: varchar("user_id", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

export const userRelations = relations(users, ({ one, many }) => ({
  wallet: one(walletBalances, {
    fields: [users.id],
    references: [walletBalances.userId],
  }),
  otomoProfiles: many(otomoProfiles),
  charges: many(walletCharges),
  usages: many(walletUsages),
  calls: many(calls),
}));

export const otomoRelations = relations(otomoProfiles, ({ one, many }) => ({
  owner: one(users, {
    fields: [otomoProfiles.ownerUserId],
    references: [users.id],
  }),
  calls: many(calls),
}));

export type ScheduleSlot = {
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

function dateColumn(name: string) {
  return timestamp(name, { withTimezone: false });
}
