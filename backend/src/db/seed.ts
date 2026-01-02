import "dotenv/config";
import { db } from "./drizzle.js";
import {
  callBillingUnits,
  calls,
  otomoProfiles,
  refreshTokens,
  userNotificationSettings,
  users,
  walletBalances,
  walletCharges,
  walletPlans,
  walletUsages,
} from "./schema/index.js";

async function resetTables() {
  await db.transaction(async (tx) => {
    await tx.delete(callBillingUnits);
    await tx.delete(walletUsages);
    await tx.delete(walletCharges);
    await tx.delete(calls);
    await tx.delete(refreshTokens);
    await tx.delete(walletBalances);
    await tx.delete(walletPlans);
    await tx.delete(userNotificationSettings);
    await tx.delete(otomoProfiles);
    await tx.delete(users);
  });
}

async function seedUsers() {
  const now = new Date();

  const userRows = [
    {
      id: "user-123",
      name: "Taro",
      email: "taro@example.com",
      avatarUrl: "https://cdn.local/users/taro.png",
      bio: "Sample primary account",
      gender: "male",
      birthday: now,
      balance: 1200,
      passwordHash:
        "$2b$10$r5g2bHujNKJMkBz7OpHSxO/XrXhsat1qNvrcvxKl6nQe.iTMfPCY2",
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "otomo-owner-001",
      name: "Misaki",
      email: "misaki@example.com",
      avatarUrl: "https://cdn.local/users/misaki.png",
      bio: "Otomo operator",
      gender: "female",
      birthday: now,
      balance: 0,
      passwordHash:
        "$2b$10$r5g2bHujNKJMkBz7OpHSxO/XrXhsat1qNvrcvxKl6nQe.iTMfPCY2",
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
  ] satisfies Array<typeof users.$inferInsert>;

  await db.insert(users).values(userRows);

  await db.insert(userNotificationSettings).values({
    userId: "user-123",
    incomingCall: true,
    callSummary: true,
    walletAlert: true,
    marketing: false,
    updatedAt: now,
  });
}

async function seedWallet() {
  const now = new Date();

  const planRows = [
    {
      id: "plan_basic",
      title: "Basic Charge",
      priceYen: 500,
      points: 500,
      bonusPoints: 0,
      description: "Entry level plan to test calls",
      isActive: true,
      createdAt: now,
    },
    {
      id: "plan_plus",
      title: "Plus Charge",
      priceYen: 1000,
      points: 1100,
      bonusPoints: 100,
      description: "Most popular option",
      isActive: true,
      createdAt: now,
    },
    {
      id: "plan_pro",
      title: "Pro Charge",
      priceYen: 3000,
      points: 3600,
      bonusPoints: 600,
      description: "Heavy user pack",
      isActive: true,
      createdAt: now,
    },
  ] satisfies Array<typeof walletPlans.$inferInsert>;

  await db.insert(walletPlans).values(planRows);

  await db.insert(walletBalances).values({
    userId: "user-123",
    balance: 1200,
    updatedAt: now,
  });

  await db.insert(walletCharges).values({
    userId: "user-123",
    planId: "plan_plus",
    paymentId: "pay_demo_001",
    amountYen: 1000,
    grantedPoints: 1100,
    bonusPoints: 100,
    createdAt: now,
  });
}

async function seedOtomo() {
  const now = new Date();

  await db.insert(otomoProfiles).values({
    id: "otomo_001",
    ownerUserId: "otomo-owner-001",
    displayName: "Misaki",
    profileImageUrl: "https://cdn.local/otomo/otomo_001.png",
    age: 25,
    gender: "female",
    introduction: "Friendly otomo ready for local testing.",
    tags: ["healing", "listener"],
    genres: ["talk", "consult"],
    statusMessage: "Waiting for requests",
    isOnline: true,
    isAvailable: true,
    pricePerMinute: 120,
    rating: "4.8",
    reviewCount: 54,
    statusUpdatedAt: now,
    schedule: [
      { dayOfWeek: "monday", start: "20:00", end: "23:00" },
      { dayOfWeek: "thursday", start: "21:00", end: "23:30" },
    ],
  });
}

async function seedCalls() {
  const start = new Date("2025-01-10T12:03:20Z");
  const end = new Date("2025-01-10T12:15:20Z");

  await db.insert(calls).values({
    id: "call_demo_001",
    userId: "user-123",
    otomoId: "otomo_001",
    startedAt: start,
    connectedAt: start,
    endedAt: end,
    durationSeconds: 720,
    billedUnits: 12,
    billedPoints: 1200,
    status: "ended",
    endReason: "user_end",
  });

  const billingRows = [
    {
      callId: "call_demo_001",
      minuteIndex: 0,
      chargedPoints: 100,
      timestamp: start,
    },
    {
      callId: "call_demo_001",
      minuteIndex: 1,
      chargedPoints: 100,
      timestamp: new Date("2025-01-10T12:04:20Z"),
    },
  ] satisfies Array<typeof callBillingUnits.$inferInsert>;

  await db.insert(callBillingUnits).values(billingRows);

  await db.insert(walletUsages).values({
    userId: "user-123",
    callId: "call_demo_001",
    otomoId: "otomo_001",
    usedPoints: 240,
    durationMinutes: 2,
    createdAt: end,
  });
}

async function main() {
  console.log("Resetting tables...");
  await resetTables();

  console.log("Seeding users...");
  await seedUsers();

  console.log("Seeding wallet...");
  await seedWallet();

  console.log("Seeding otomo...");
  await seedOtomo();

  console.log("Seeding calls...");
  await seedCalls();

  console.log("✅ Seed data inserted successfully");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Failed to seed database");
  console.error(error);
  process.exit(1);
});
