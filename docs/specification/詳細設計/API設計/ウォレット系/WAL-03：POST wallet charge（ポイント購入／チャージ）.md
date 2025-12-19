# WAL-03：POST /wallet/charge（ポイント購入／チャージ）

※決済手段（Stripe / App Store / Google Play / クレカ / PayPay など）は未確定として、本APIは「決済後にポイント付与するサーバー側処理」として設計します。

---

## 目的

ユーザーがチャージプランを購入した際に**決済済みであることを確認したうえで、ポイントを付与する**。

### 想定フロー（Stripe例）

1. フロント → Stripe Checkout を開始
2. Stripe → 決済完了
3. Stripe Webhook → サーバー（検証）
4. サーバー → `/wallet/charge` を実行（内部からでもOK）

外部決済と連携する場合、**この API はサーバー内部呼び出し専用でもOK**。

今回はユーザー発行としても使えるよう汎用設計にします。

---

# エンドポイント仕様

### **Method**

```
POST /wallet/charge
```

### **認証**

- 必須（Supabase Auth JWT）
- Header:

```
Authorization: Bearer <token>
```

---

# リクエストボディ例

```json
{
  "planId": "plan_002",
  "paymentId": "pay_abc12345",
  "amount": 1000
}
```

---

# リクエストフィールド説明

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `planId` | string | ◯ | 購入したチャージプランID |
| `paymentId` | string | ◯ | 決済サービス側の決済ID（Stripe等） |
| `amount` | number | ◯ | 実際に決済された金額（円） |

---

# 処理内容

1. `planId` が存在するか確認
2. `paymentId` が既に処理済みでないか確認（二重付与の防止）
3. `amount` がプラン価格と一致するか確認（不正購入防止）
4. ポイントウォレットに加算
5. wallet_history に履歴追加
6. `paymentId` を記録して再実行を防止

---

# レスポンス例（成功）

### **Status: 200 OK**

```json
{
  "userId": "user_123",
  "chargedPoints": 1100,
  "balance": 2600,
  "planId": "plan_002",
  "paymentId": "pay_abc12345"
}
```

---

# エラーレスポンス例

### **400 Bad Request：金額不一致**

```json
{
  "error": "INVALID_AMOUNT",
  "message": "決済金額がプラン料金と一致しません。"
}
```

### **404 Not Found：プランなし**

```json
{
  "error": "PLAN_NOT_FOUND",
  "message": "指定されたチャージプランが存在しません。"
}
```

### **409 Conflict：二重決済**

```json
{
  "error": "PAYMENT_ALREADY_PROCESSED",
  "message": "この決済IDはすでに処理済みです。"
}
```

---

# Fastify（TypeScript）実装例

```tsx
fastify.post("/wallet/charge", async (request, reply) => {
  const { userId } = request.user;

  const { planId, paymentId, amount } = request.body as {
    planId: string;
    paymentId: string;
    amount: number;
  };

  // プラン確認
  const plan = await fastify.db.chargePlan.findUnique({
    where: { planId }
  });

  if (!plan) {
    return reply.status(404).send({
      error: "PLAN_NOT_FOUND",
      message: "指定されたチャージプランが存在しません。"
    });
  }

  // 金額一致チェック
  if (amount !== plan.price) {
    return reply.status(400).send({
      error: "INVALID_AMOUNT",
      message: "決済金額がプラン料金と一致しません。"
    });
  }

  // 二重決済チェック
  const already = await fastify.db.walletHistory.findUnique({
    where: { paymentId }
  });

  if (already) {
    return reply.status(409).send({
      error: "PAYMENT_ALREADY_PROCESSED",
      message: "この決済IDはすでに処理済みです。"
    });
  }

  // トランザクションで安全に処理
  const result = await fastify.db.$transaction(async (tx) => {
    const wallet = await tx.wallet.update({
      where: { userId },
      data: { balance: { increment: plan.points + plan.bonusPoints } }
    });

    await tx.walletHistory.create({
      data: {
        userId,
        planId,
        paymentId,
        amount,
        points: plan.points,
        bonusPoints: plan.bonusPoints
      }
    });

    return wallet;
  });

  return reply.send({
    userId,
    chargedPoints: plan.points + plan.bonusPoints,
    balance: result.balance,
    planId,
    paymentId
  });
});
```

---

# WalletHistory テーブル例

| カラム | 型 | 説明 |
| --- | --- | --- |
| historyId | string | PK |
| userId | string | ユーザーID |
| planId | string | チャージプランID |
| paymentId | string | 決済ID（ユニーク） |
| amount | number | 支払金額 |
| points | number | 通常ポイント |
| bonusPoints | number | ボーナス |
| createdAt | datetime | 付与日時 |