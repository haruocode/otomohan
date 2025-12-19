const now = () => new Date().toISOString();

const walletBalance = {
  balance: 2400,
  currency: "points",
  updatedAt: now(),
};

const walletPlans = [
  { id: "basic-30", name: "ライト30", amount: 30, price: 400, bonus: 0 },
  { id: "plus-60", name: "スタンダード60", amount: 60, price: 700, bonus: 5 },
  { id: "max-120", name: "プレミアム120", amount: 120, price: 1300, bonus: 15 },
];

const otomoList = [
  {
    id: "otomo-001",
    displayName: "Hana",
    rating: 4.8,
    pricePerMinute: 120,
    tags: ["明るい", "雑談"],
    status: "available",
    bio: "ゆるっと雑談したい人向け。24時まで対応可能。",
    avatarUrl: "/static/avatar/hana.png",
  },
  {
    id: "otomo-002",
    displayName: "Kento",
    rating: 4.5,
    pricePerMinute: 150,
    tags: ["相談", "夜ふかし"],
    status: "on_call",
    bio: "深夜の相談・作業通話が得意です。",
    avatarUrl: "/static/avatar/kento.png",
  },
  {
    id: "otomo-003",
    displayName: "Mika",
    rating: 4.9,
    pricePerMinute: 180,
    tags: ["作業", "英語"],
    status: "away",
    bio: "英語での雑談・発音チェックもOK。週末は朝活メイン。",
    avatarUrl: "/static/avatar/mika.png",
  },
];

const calls = [
  {
    id: "call-20241201-001",
    otomoId: "otomo-001",
    otomoName: "Hana",
    startedAt: "2024-12-01T13:00:00.000Z",
    endedAt: "2024-12-01T13:32:00.000Z",
    durationMinutes: 32,
    pointsUsed: 384,
    summary: "年末の予定について雑談しました。",
  },
  {
    id: "call-20241215-002",
    otomoId: "otomo-003",
    otomoName: "Mika",
    startedAt: "2024-12-15T01:10:00.000Z",
    endedAt: "2024-12-15T01:55:00.000Z",
    durationMinutes: 45,
    pointsUsed: 810,
    summary: "作業通話で集中サポート。",
  },
];

module.exports = {
  now,
  walletBalance,
  walletPlans,
  otomoList,
  calls,
};
