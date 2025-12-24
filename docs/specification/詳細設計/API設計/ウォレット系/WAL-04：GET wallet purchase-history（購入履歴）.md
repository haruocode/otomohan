# WAL-04：GET /wallet/purchase-history（購入履歴）

この API は、ユーザーマイページの「購入履歴」画面（U-07 の追加機能）用として想定されます。チャージ履歴を見られるようにするための **読み取り専用 API** です。

---

## 目的

ユーザーがこれまでに購入した **ポイントチャージ履歴（課金履歴）** を取得する。

- チャージプラン名
- 料金
- 付与ポイント
- 購入日付
- paymentId（内部識別用）

を含む。

---

# エンドポイント仕様

### **Method**

```
GET /wallet/purchase-history
```

### **認証**

- 必須（Supabase Auth JWT）
- Header:

```
Authorization: Bearer <token>
```

---

# クエリパラメータ（任意）

| パラメータ | 型        | 初期値    | 説明         |
| ---------- | --------- | --------- | ------------ |
| `limit`    | number    | 20        | 取得件数     |
| `offset`   | number    | 0         | ページング用 |
| `sort`     | `"newest" | "oldest"` | `"newest"`   |

---

# レスポンス仕様（成功）

### **200 OK**

```json
{
  "items": [
    {
      "historyId": "hist_001",
      "planId": "plan_002",
      "planTitle": "おすすめプラン",
      "amount": 1000,
      "points": 1000,
      "bonusPoints": 100,
      "paymentId": "pay_abc123",
      "createdAt": "2025-01-15T12:00:00Z"
    }
  ],
  "total": 1
}
```

---

# 各フィールド説明

| フィールド    | 説明                                    |
| ------------- | --------------------------------------- |
| `historyId`   | 購入履歴 ID（wallet_history の PK）     |
| `planId`      | 購入したプランの ID                     |
| `planTitle`   | プラン名（chargePlan テーブルから取得） |
| `amount`      | 支払金額                                |
| `points`      | 通常ポイント                            |
| `bonusPoints` | ボーナス付与ポイント                    |
| `paymentId`   | 決済サービス側の決済 ID                 |
| `createdAt`   | 購入日（付与日）                        |

---

# エラーレスポンス例

ポイント履歴が存在しない場合も 200（空配列）とするのが一般的。

DB エラー時のみ 500 を返す。

```json
{
  "error": "INTERNAL_ERROR",
  "message": "購入履歴の取得に失敗しました。"
}
```

---

# Fastify（TypeScript）実装例

```tsx
fastify.get("/wallet/purchase-history", async (request, reply) => {
  const { userId } = request.user;

  const {
    limit = 20,
    offset = 0,
    sort = "newest",
  } = request.query as {
    limit?: number;
    offset?: number;
    sort?: "newest" | "oldest";
  };

  const sortOption =
    sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

  const items = await fastify.db.walletHistory.findMany({
    where: { userId },
    take: limit,
    skip: offset,
    orderBy: sortOption,
    include: {
      plan: true, // plan.title を取得するため
    },
  });

  const total = await fastify.db.walletHistory.count({
    where: { userId },
  });

  return reply.send({
    items: items.map((h) => ({
      historyId: h.historyId,
      planId: h.planId,
      planTitle: h.plan.title,
      amount: h.amount,
      points: h.points,
      bonusPoints: h.bonusPoints,
      paymentId: h.paymentId,
      createdAt: h.createdAt,
    })),
    total,
  });
});
```

---

# WalletHistory テーブル（再掲）

| カラム      | 説明                |
| ----------- | ------------------- |
| historyId   | PK                  |
| userId      | ユーザー ID         |
| planId      | プラン ID           |
| paymentId   | 決済 ID（ユニーク） |
| amount      | 金額                |
| points      | 通常ポイント        |
| bonusPoints | ボーナス            |
| createdAt   | 購入日時            |

---

# WAL 系 API 一覧（ここまでの進捗）

| コード | API                          | 内容               |
| ------ | ---------------------------- | ------------------ |
| WAL-01 | GET /wallet/balance          | 残ポイント取得     |
| WAL-02 | GET /wallet/plans            | チャージプラン一覧 |
| WAL-03 | POST /wallet/charge          | 購入処理           |
| WAL-04 | GET /wallet/purchase-history | チャージ履歴取得   |
