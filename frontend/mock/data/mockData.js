const now = () => new Date().toISOString()

const walletBalance = {
  balance: 2400,
  currency: 'points',
  updatedAt: now(),
}

const walletPlans = [
  { id: 'basic-30', name: 'ライト30', amount: 30, price: 400, bonus: 0 },
  { id: 'plus-60', name: 'スタンダード60', amount: 60, price: 700, bonus: 5 },
  { id: 'max-120', name: 'プレミアム120', amount: 120, price: 1300, bonus: 15 },
]

const otomoList = [
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

const calls = [
  {
    id: 'call-20241201-001',
    otomoId: 'otomo-001',
    otomoName: 'Hana',
    startedAt: '2024-12-01T13:00:00.000Z',
    endedAt: '2024-12-01T13:32:00.000Z',
    durationMinutes: 32,
    pointsUsed: 384,
    summary: '年末の予定について雑談しました。',
  },
  {
    id: 'call-20241215-002',
    otomoId: 'otomo-003',
    otomoName: 'Mika',
    startedAt: '2024-12-15T01:10:00.000Z',
    endedAt: '2024-12-15T01:55:00.000Z',
    durationMinutes: 45,
    pointsUsed: 810,
    summary: '作業通話で集中サポート。',
  },
]

module.exports = {
  now,
  walletBalance,
  walletPlans,
  otomoList,
  calls,
}
