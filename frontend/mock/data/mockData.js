export const now = () => new Date().toISOString()

export const walletBalance = {
  balance: 2400,
  currency: 'points',
  updatedAt: now(),
}

export const walletPlans = [
  { id: 'basic-30', name: 'ライト30', amount: 30, price: 400, bonus: 0 },
  { id: 'plus-60', name: 'スタンダード60', amount: 60, price: 700, bonus: 5 },
  { id: 'max-120', name: 'プレミアム120', amount: 120, price: 1300, bonus: 15 },
]
export const walletUsage = [
  {
    id: 'usage-001',
    type: 'call_debit',
    title: '通話でポイントを使用',
    description: 'Hana さんとの通話',
    direction: 'debit',
    amount: 300,
    occurredAt: minutesFromNow(-5),
  },
  {
    id: 'usage-002',
    type: 'call_debit',
    title: '通話でポイントを使用',
    description: 'Kento さんとの通話',
    direction: 'debit',
    amount: 120,
    occurredAt: minutesFromNow(-35),
  },
  {
    id: 'usage-003',
    type: 'charge_credit',
    title: 'ポイントをチャージ',
    description: 'ライト30 プラン',
    direction: 'credit',
    amount: 35,
    occurredAt: minutesFromNow(-240),
  },
  {
    id: 'usage-004',
    type: 'call_debit',
    title: '通話でポイントを使用',
    description: 'Mika さんとの通話',
    direction: 'debit',
    amount: 180,
    occurredAt: minutesFromNow(-1440),
  },
  {
    id: 'usage-005',
    type: 'bonus_credit',
    title: '期間限定ボーナス',
    description: 'ウィークリーミッション達成',
    direction: 'credit',
    amount: 20,
    occurredAt: minutesFromNow(-2880),
  },
]

export const otomoList = [
  {
    id: 'otomo-001',
    displayName: 'Hana',
    rating: 4.8,
    reviewCount: 132,
    pricePerMinute: 120,
    tags: ['明るい', '雑談'],
    status: 'available',
    bio: 'ゆるっと雑談したい人向け。24時まで対応可能。',
    avatarUrl: '/static/avatar/hana.png',
    intro:
      'はじめまして、Hanaです。作業や雑談、気軽なお悩みまで幅広く聞きます！',
    categories: ['恋愛相談', '雑談', '夜ふかし'],
    activeHours: '18:00〜24:00',
    hobbies: ['カフェ巡り', 'アニメ', 'ゲーム'],
    reviews: [
      {
        user: 'たろう',
        rating: 5,
        comment: 'テンポ良く話が進んで楽しかったです！',
        date: '2025-01-15',
      },
      {
        user: 'みさき',
        rating: 4,
        comment: '落ち着いた声で安心して話せました。',
        date: '2025-01-10',
      },
      {
        user: 'Yu',
        rating: 5,
        comment: '雑談から相談まで拾ってくれて頼もしい',
        date: '2024-12-30',
      },
    ],
  },
  {
    id: 'otomo-002',
    displayName: 'Kento',
    rating: 4.5,
    reviewCount: 88,
    pricePerMinute: 150,
    tags: ['相談', '夜ふかし'],
    status: 'on_call',
    bio: '深夜の相談・作業通話が得意です。',
    avatarUrl: '/static/avatar/kento.png',
    intro: '夜ふかし仲間募集！深夜テンションで語りたい方、作業のお供にどうぞ。',
    categories: ['仕事', '進路相談', '深夜雑談'],
    activeHours: '22:00〜02:00',
    hobbies: ['筋トレ', 'SF映画', 'テックニュース'],
    reviews: [
      {
        user: 'Rina',
        rating: 4,
        comment: '的確なアドバイスでモヤモヤが晴れました。',
        date: '2025-02-02',
      },
      {
        user: 'Leo',
        rating: 5,
        comment: '作業通話で集中できた！励まし上手。',
        date: '2025-01-28',
      },
      {
        user: 'さき',
        rating: 4,
        comment: '深夜テンションで笑いっぱなしでした。',
        date: '2025-01-18',
      },
    ],
  },
  {
    id: 'otomo-003',
    displayName: 'Mika',
    rating: 4.9,
    reviewCount: 201,
    pricePerMinute: 180,
    tags: ['作業', '英語'],
    status: 'away',
    bio: '英語での雑談・発音チェックもOK。週末は朝活メイン。',
    avatarUrl: '/static/avatar/mika.png',
    intro:
      '英語練習と朝活のお供ならおまかせください。優しいフィードバックを心掛けています。',
    categories: ['英会話', '朝活', '作業通話'],
    activeHours: '06:30〜10:00',
    hobbies: ['ランニング', '読書', 'スムージー研究'],
    reviews: [
      {
        user: 'Ken',
        rating: 5,
        comment: '英語の発音を丁寧に直してもらえて自信がつきました。',
        date: '2025-02-05',
      },
      {
        user: 'mayu',
        rating: 5,
        comment: '朝活仲間として最高。毎朝励まされてます。',
        date: '2025-01-22',
      },
      {
        user: 'Sora',
        rating: 4,
        comment: '作業通話で集中力が上がった！',
        date: '2025-01-12',
      },
    ],
  },
]

const minutesFromNow = (minutes) =>
  new Date(Date.now() + minutes * 60_000).toISOString()

const unixMinutesFromNow = (minutes) =>
  Math.floor((Date.now() + minutes * 60_000) / 1000)

const END_REASONS = ['user_end', 'otomo_end', 'no_point', 'network_lost']

const createBillingUnits = (price, count) =>
  Array.from({ length: count }, (_value, unitIndex) => ({
    unitIndex: unitIndex + 1,
    charged: price,
    timestamp: minutesFromNow(-(count - unitIndex)),
  }))

const createCallRecord = (otomo, index) => {
  const unitCount = 3 + (index % 2)
  const totalSeconds = unitCount * 60 + index * 12
  const startedMinutesAgo = unitCount + index
  const status = index % 2 === 0 ? 'in_call' : 'ended'
  const reason = END_REASONS[index % END_REASONS.length]

  return {
    id: `call-${otomo.id}`,
    status,
    partner: {
      id: otomo.id,
      name: otomo.displayName,
      avatarUrl: otomo.avatarUrl,
    },
    pricePerMinute: otomo.pricePerMinute,
    startedAt: minutesFromNow(-startedMinutesAgo),
    lastBilledAt: minutesFromNow(-1),
    nextBillingAt:
      status === 'in_call' ? minutesFromNow(1 - index * 0.2) : undefined,
    balance: Math.max(
      otomo.pricePerMinute,
      walletBalance.balance - index * 180,
    ),
    totalSeconds,
    totalCharged: otomo.pricePerMinute * unitCount,
    unitCount,
    reason,
    billingUnits: createBillingUnits(otomo.pricePerMinute, unitCount),
  }
}

export const calls = otomoList.map((otomo, index) =>
  createCallRecord(otomo, index),
)

const callHistorySeed = [
  {
    callId: 'history-001',
    otomoId: 'otomo-001',
    minutesAgo: 90,
    durationSec: 420,
  },
  {
    callId: 'history-002',
    otomoId: 'otomo-002',
    minutesAgo: 320,
    durationSec: 540,
  },
  {
    callId: 'history-003',
    otomoId: 'otomo-003',
    minutesAgo: 1440,
    durationSec: 360,
  },
  {
    callId: 'history-004',
    otomoId: 'otomo-002',
    minutesAgo: 4320,
    durationSec: 0,
  },
  {
    callId: 'history-005',
    otomoId: 'otomo-001',
    minutesAgo: 7200,
    durationSec: 360,
  },
]

const billedMinutes = (seconds) => {
  if (!seconds) return 0
  return Math.max(1, Math.ceil(seconds / 60))
}

export const callHistory = callHistorySeed.map((record) => {
  const otomo =
    otomoList.find((item) => item.id === record.otomoId) ?? otomoList[0]
  const startedAt = unixMinutesFromNow(-record.minutesAgo)
  const durationSec = record.durationSec
  const endedAt = durationSec > 0 ? startedAt + durationSec : startedAt
  const chargeUnits = billedMinutes(durationSec)

  return {
    callId: record.callId,
    otomo: {
      id: otomo.id,
      name: otomo.displayName,
      avatarUrl: otomo.avatarUrl,
    },
    startedAt,
    endedAt,
    durationSec,
    totalCharged: chargeUnits * otomo.pricePerMinute,
  }
})

export const userProfile = {
  id: 'user-001',
  name: 'たろう',
  email: 'taro@example.com',
  avatarUrl: '/static/avatar/user-default.png',
  intro:
    '深夜の雑談と作業通話が好きなエンジニアです。コーヒー片手に話せる方を探しています。',
}

export const otomoRewardSummary = {
  todayPoints: 1250,
  totalPoints: 43200,
  weekPoints: 8200,
  pendingPoints: 240,
  lastUpdatedAt: now(),
}

export const otomoCallFeed = [
  {
    callId: 'otomo-call-001',
    userName: 'たろう',
    startedAt: minutesFromNow(-90),
    durationMinutes: 7,
  },
  {
    callId: 'otomo-call-002',
    userName: 'みゆき',
    startedAt: minutesFromNow(-180),
    durationMinutes: 20,
  },
  {
    callId: 'otomo-call-003',
    userName: 'ケント',
    startedAt: minutesFromNow(-1440),
    durationMinutes: 12,
  },
  {
    callId: 'otomo-call-004',
    userName: 'ひかる',
    startedAt: minutesFromNow(-2200),
    durationMinutes: 30,
  },
]

export const otomoSelf = {
  id: 'otomo-self-001',
  name: 'さくら',
  avatarUrl: '/static/avatar/hana.png',
  status: 'online',
  bio: '夜ふかし雑談と作業通話が得意。落ち着いた声でゆったり話します。',
  specialties: ['夜ふかし雑談', '作業通話', '恋愛相談'],
  rating: 4.9,
  reviewCount: 210,
  streakDays: 12,
  todayPoints: otomoRewardSummary.todayPoints,
  totalPoints: otomoRewardSummary.totalPoints,
  availabilityMessage: '待機中：リクエストを受信できます',
  statusNote: 'オンライン',
  notifications: 2,
}
