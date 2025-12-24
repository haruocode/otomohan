# WAL-02：GET /wallet/plans

この API は、ユーザーがポイント購入画面で表示する「チャージプランの一覧」を取得するためのものです。

---

## 目的

- ユーザーが購入できる **チャージプラン一覧を取得** する
- 値段・付与ポイント・説明文などをフロント側で表示する
- プラン数は少ない想定（3〜6 個程度）

---

# エンドポイント仕様

### **Method**

```
GET /wallet/plans
```

### **認証**

- 不要（公開 API）
  → ログイン前に価格表を見られるようにするため

---

# クエリパラメータ

なし

---

# レスポンス仕様（成功時）

### **Status: 200 OK**

```json
{
  "items": [
    {
      "planId": "plan_001",
      "title": "お手軽チャージ",
      "price": 500,
      "points": 500,
      "bonusPoints": 0,
      "description": "気軽にチャージできる入門プラン"
    },
    {
      "planId": "plan_002",
      "title": "おすすめプラン",
      "price": 1000,
      "points": 1000,
      "bonusPoints": 100,
      "description": "ちょっとお得なボーナス付きプラン"
    },
    {
      "planId": "plan_003",
      "title": "たっぷりプラン",
      "price": 3000,
      "points": 3000,
      "bonusPoints": 500,
      "description": "長く話したい人におすすめの大容量プラン"
    }
  ]
}
```

---

# フィールド説明

| フィールド    | 型     | 説明                     |
| ------------- | ------ | ------------------------ |
| `planId`      | string | チャージプラン ID        |
| `title`       | string | プラン名                 |
| `price`       | number | 料金（円）               |
| `points`      | number | 付与ポイント             |
| `bonusPoints` | number | ボーナスポイント（任意） |
| `description` | string | プラン説明文（UI 用）    |

---

# エラーレスポンス

基本的にはエラーは少ないが、DB 障害などでは以下のように返す：

### **500 Internal Server Error**

```json
{
  "error": "INTERNAL_ERROR",
  "message": "チャージプラン一覧の取得に失敗しました。"
}
```

---

# Fastify（TypeScript）実装例

※ プランは DB または環境変数／config ファイルで管理すると便利です。

```tsx
fastify.get("/wallet/plans", async (_request, reply) => {
  // DB から取得する場合（例）
  const plans = await fastify.db.chargePlan.findMany({
    orderBy: { price: "asc" },
  });

  return reply.send({ items: plans });
});
```

---

# ChargePlan テーブル（例）

| カラム      | 型      | 説明             |
| ----------- | ------- | ---------------- |
| planId      | string  | プラン ID        |
| title       | string  | プラン名         |
| price       | number  | 料金（円）       |
| points      | number  | 基本付与ポイント |
| bonusPoints | number  | ボーナス         |
| description | string  | UI 用説明文      |
| isActive    | boolean | 表示中のプランか |
