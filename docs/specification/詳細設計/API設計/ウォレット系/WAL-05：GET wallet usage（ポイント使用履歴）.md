# WAL-05：GET /wallet/usage（ポイント使用履歴）

これは「通話で消費したポイントの履歴」を参照するための API です。「いつ」「誰との通話で」「何ポイント消費したか」をユーザーが確認できる機能。

---

## 目的

ユーザーが **ポイントの使用履歴（特に通話消費）** を確認できるようにする。

一例：

- おともはん「みさき」さんとの通話で 240pt 消費
- 日付は 2025/01/15
- 通話時間 2分 など

通話ごとのサマリーが取得できる API。

---

# エンドポイント仕様

### **Method**

```
GET /wallet/usage
```

### **認証**

- 必須（Supabase Auth JWT）
- Header:

```
Authorization: Bearer <token>
```

---

# クエリパラメータ

| パラメータ | 型 | 初期値 | 説明 |
| --- | --- | --- | --- |
| `limit` | number | 20 | 取得件数 |
| `offset` | number | 0 | ページング |
| `sort` | `"newest" | "oldest"` | `"newest"` |
| `otomoId` | string | なし | 特定のおともはんに絞る（任意） |

---

# レスポンス仕様

### **200 OK**

```json
{
  "items": [
    {
      "usageId": "usage_001",
      "callId": "call_abc123",
      "otomoId": "otomo_001",
      "otomoName": "みさき",
      "usedPoints": 240,
      "durationMinutes": 2,
      "createdAt": "2025-01-15T12:00:00Z"
    }
  ],
  "total": 1
}
```

---

# フィールド説明

| フィールド | 説明 |
| --- | --- |
| `usageId` | 使用履歴ID（wallet_usage の PK） |
| `callId` | 通話ID（call テーブルと連携） |
| `otomoId` | 対象のおともはんID |
| `otomoName` | おともはんの表示名 |
| `usedPoints` | 消費ポイント数（通話で使った合計） |
| `durationMinutes` | 通話時間（分・または秒換算） |
| `createdAt` | ポイントが消費された日 |

---

# どのタイミングで記録される？

### 通話終了時（CALL-02）に次の要素が確定する：

- 通話ID
- 通話相手（おともはんID）
- 通話時間（秒）
- 総消費ポイント
    
    → `usedPoints = pricePerMinute * 通話分数（切り上げ）`
    
- 使用履歴の新規保存

※この API は **あくまで参照用**。

---

# エラーレスポンス例

DB トラブル時のみ：

```json
{
  "error": "INTERNAL_ERROR",
  "message": "ポイント使用履歴の取得に失敗しました。"
}
```

---

# Fastify（TypeScript）実装例

```tsx
fastify.get("/wallet/usage", async (request, reply) => {
  const { userId } = request.user;

  const {
    limit = 20,
    offset = 0,
    sort = "newest",
    otomoId
  } = request.query as {
    limit?: number;
    offset?: number;
    sort?: "newest" | "oldest";
    otomoId?: string;
  };

  const sortOption =
    sort === "oldest"
      ? { createdAt: "asc" }
      : { createdAt: "desc" };

  const items = await fastify.db.walletUsage.findMany({
    where: {
      userId,
      ...(otomoId ? { otomoId } : {})
    },
    take: limit,
    skip: offset,
    orderBy: sortOption,
    include: {
      otomo: true, // 名前取得のため
      call: true   // 通話詳細が必要なら
    }
  });

  const total = await fastify.db.walletUsage.count({
    where: {
      userId,
      ...(otomoId ? { otomoId } : {})
    }
  });

  return reply.send({
    items: items.map(u => ({
      usageId: u.usageId,
      callId: u.callId,
      otomoId: u.otomoId,
      otomoName: u.otomo.displayName,
      usedPoints: u.usedPoints,
      durationMinutes: u.durationMinutes,
      createdAt: u.createdAt
    })),
    total
  });
});
```

---

# WalletUsage テーブル例

| カラム | 型 | 説明 |
| --- | --- | --- |
| usageId | string | PK |
| userId | string | ユーザー |
| callId | string | 通話ID |
| otomoId | string | おともはん |
| usedPoints | number | 消費ポイント |
| durationMinutes | number | 通話時間（分換算） |
| createdAt | datetime | 消費日 |

※このテーブルは **通話終了時に1レコード作成**。