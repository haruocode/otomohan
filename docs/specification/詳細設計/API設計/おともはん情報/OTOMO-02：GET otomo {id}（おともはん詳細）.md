# OTOMO-02：GET /otomo/{id}（おともはん詳細）

## 目的

ユーザーが特定のおともはんを選択した際に、**プロフィール・得意ジャンル・通話可能状態・評価・自己紹介・スケジュール**などの詳細情報を取得する。

一覧では簡易情報のみ返すため、詳細 API はそれを補完する位置づけ。

---

# エンドポイント仕様

### **Method**

```
GET /otomo/{id}
```

### **認証**

- 必須（Supabase Auth の JWT）
- Header:

```
Authorization: Bearer <token>
```

---

# パスパラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `id` | string | おともはんID |

---

# レスポンス仕様（成功時）

### **Status: 200 OK**

```json
{
  "otomoId": "otomo_001",
  "displayName": "みさき",
  "profileImageUrl": "https://cdn.example.com/otomo/001.jpg",

  "age": 25,
  "gender": "female",
  "genres": ["healing", "talk", "consult"],
  "introduction": "はじめまして、みさきです。のんびりお話ししましょう。",
  "tags": ["癒し系", "傾聴", "お姉さんタイプ"],

  "isOnline": true,
  "isAvailable": true,

  "pricePerMinute": 120,
  "rating": 4.8,
  "reviewCount": 54,

  "reviews": [
    {
      "reviewId": "rev_001",
      "userDisplayName": "たかはるさん",
      "score": 5,
      "comment": "優しく話を聞いてくれました！",
      "createdAt": "2025-01-10T12:00:00Z"
    }
  ],

  "schedule": [
    {
      "dayOfWeek": "monday",
      "start": "20:00",
      "end": "23:00"
    },
    {
      "dayOfWeek": "tuesday",
      "start": "21:00",
      "end": "22:00"
    }
  ]
}
```

---

# 各フィールドの定義

### **基本情報**

| フィールド | 型 | 内容 |
| --- | --- | --- |
| `otomoId` | string | おともはんID |
| `displayName` | string | 表示名 |
| `profileImageUrl` | string | プロフィール画像URL |
| `age` | number | 年齢 |
| `gender` | string | `"male" |
| `genres` | string[] | 得意ジャンル（例：healing, talk, consult） |
| `introduction` | string | 自己紹介テキスト |
| `tags` | string[] | 補助的なタグ表示用 |

---

### **ステータス**

| フィールド | 型 | 内容 |
| --- | --- | --- |
| `isOnline` | boolean | オンラインか |
| `isAvailable` | boolean | 通話可能か（他のユーザーと通話中でない） |

---

### **料金・評価情報**

| フィールド | 型 | 内容 |
| --- | --- | --- |
| `pricePerMinute` | number | 1分あたり料金 |
| `rating` | number | 平均評価 |
| `reviewCount` | number | レビュー件数 |

---

### **reviews[]（直近数件のみ返す）**

| フィールド | 説明 |
| --- | --- |
| `reviewId` | レビューID |
| `userDisplayName` | 投稿者の表示名 |
| `score` | 星評価（1〜5） |
| `comment` | コメント |
| `createdAt` | 投稿日 |

補足:

- 全件取得 API を別で用意するかは要相談（ページングが必要な場合）

---

### **schedule[]（稼働スケジュール）**

例：

```json
{
  "dayOfWeek": "monday",
  "start": "20:00",
  "end": "23:00"
}
```

用途：

- 予約制ではないが、ユーザーが「いつ話せるか」を判断できるようにする

---

# エラーレスポンス仕様

### **404 Not Found**

```json
{
  "error": "OTOMO_NOT_FOUND",
  "message": "指定されたおともはんは存在しません。"
}
```

---

# Fastify（TypeScript）側の処理例

```tsx
fastify.get("/otomo/:id", async (request, reply) => {
  const { id } = request.params as { id: string };

  const otomo = await fastify.db.otomo.findUnique({
    where: { otomoId: id },
    include: {
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" }
      },
      schedules: true
    }
  });

  if (!otomo) {
    return reply.status(404).send({
      error: "OTOMO_NOT_FOUND",
      message: "指定されたおともはんは存在しません。"
    });
  }

  return reply.send(otomo);
});
```