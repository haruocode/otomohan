# WAL-01：GET /wallet/balance

## 目的

ログイン中のユーザーが、**現在の所持ポイント(残高)を取得する** ためのAPI。通話開始前のチェック、ポイント購入画面、マイページなどで利用。

---

# エンドポイント仕様

### **Method**

```
GET /wallet/balance
```

### **認証**

- 必須（Supabase Auth JWT）
- Header:

```
Authorization: Bearer <token>
```

---

# リクエストパラメータ

なし

（`userId` は JWT から取得）

---

# レスポンス仕様（成功時）

### **Status: 200 OK**

```json
{
  "userId": "user_123",
  "balance": 1500,
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

---

# フィールド説明

| フィールド | 型 | 内容 |
| --- | --- | --- |
| `userId` | string | ユーザーID |
| `balance` | number | 現在の残ポイント |
| `updatedAt` | string | 最終更新日時（内部のトランザクション反映時間） |

---

# エラーレスポンス例

### **404 Not Found**

ウォレットがまだ作成されていない場合（新規ユーザーなど）

```json
{
  "error": "WALLET_NOT_FOUND",
  "message": "ウォレット情報が見つかりません。"
}
```

### **500 Internal Server Error**

データベースエラー時など

```json
{
  "error": "INTERNAL_ERROR",
  "message": "ポイント残高の取得に失敗しました。"
}
```

---

# Fastify（TypeScript）実装例

```tsx
fastify.get("/wallet/balance", async (request, reply) => {
  const { userId } = request.user;

  const wallet = await fastify.db.wallet.findUnique({
    where: { userId }
  });

  if (!wallet) {
    return reply.status(404).send({
      error: "WALLET_NOT_FOUND",
      message: "ウォレット情報が見つかりません。"
    });
  }

  return reply.send({
    userId,
    balance: wallet.balance,
    updatedAt: wallet.updatedAt
  });
});
```

---

# 補足：ウォレットの基本設計メモ

ウォレットテーブル（例）

| カラム | 型 | 説明 |
| --- | --- | --- |
| userId | string | Supabase Auth のユーザーID |
| balance | number | 現在のポイント残高 |
| updatedAt | datetime | 最終更新時間 |

ポイント履歴は別テーブル（wallet_history）で管理すると安全。