# OTOMO-04：PUT /otomo/status

## 目的

おともはん本人、または運営者が**オンライン状態・通話可否・稼働ステータス** を更新するための API。ユーザー側は利用しない「内部用（おともはん／運営）」API。

---

# エンドポイント仕様

### **Method**

```
PUT /otomo/status
```

### **認証**

- 必須（Supabase Auth JWT）
- かつ「おともはん本人」または「管理者」ロールのみ操作可能
    
    （例：`role = 'otomo' | 'admin'`）
    

### **リクエストボディ**

```json
{
  "otomoId": "otomo_001",
  "isOnline": true,
  "isAvailable": true,
  "statusMessage": "待機中です！"
}
```

---

# リクエストフィールド定義

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `otomoId` | string | ◯ | 更新対象のおともはんID |
| `isOnline` | boolean | ◯ | オンライン状態 |
| `isAvailable` | boolean | ◯ | 通話可能状態（true＝待機中、false＝通話中／非稼働） |
| `statusMessage` | string | 任意 | 任意のステータスメッセージ（例：休憩中、待機中 etc） |

---

# レスポンス仕様（成功時）

### **Status: 200 OK**

```json
{
  "otomoId": "otomo_001",
  "isOnline": true,
  "isAvailable": true,
  "statusMessage": "待機中です！",
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

---

# エラーレスポンス例

### **400 Bad Request**

```json
{
  "error": "INVALID_STATUS",
  "message": "指定されたステータスが不正です。"
}
```

### **403 Forbidden**

```json
{
  "error": "FORBIDDEN",
  "message": "ステータスを更新する権限がありません。"
}
```

### **404 Not Found**

```json
{
  "error": "OTOMO_NOT_FOUND",
  "message": "指定されたおともはんは存在しません。"
}
```

---

# Fastify（TypeScript）実装例

```tsx
fastify.put("/otomo/status", async (request, reply) => {
  const { role, userId } = request.user; // Supabase Auth で付与した情報
  const { otomoId, isOnline, isAvailable, statusMessage } = request.body as {
    otomoId: string;
    isOnline: boolean;
    isAvailable: boolean;
    statusMessage?: string;
  };

  // おともはんの存在チェック
  const otomo = await fastify.db.otomo.findUnique({
    where: { otomoId },
    select: { otomoId: true, userId: true }
  });

  if (!otomo) {
    return reply.status(404).send({
      error: "OTOMO_NOT_FOUND",
      message: "指定されたおともはんは存在しません。"
    });
  }

  // 権限チェック（本人 or 管理者）
  if (!(role === "admin" || otomo.userId === userId)) {
    return reply.status(403).send({
      error: "FORBIDDEN",
      message: "ステータスを更新する権限がありません。"
    });
  }

  // ステータス更新
  const updated = await fastify.db.otomo.update({
    where: { otomoId },
    data: {
      isOnline,
      isAvailable,
      statusMessage,
      updatedAt: new Date()
    }
  });

  return reply.send(updated);
});
```

---

# ステータス更新の利用シーン例

| シーン | isOnline | isAvailable |
| --- | --- | --- |
| アプリにログイン | true | true |
| 電話中 | true | false |
| 休憩 | false | false |
| ログアウト | false | false |
| 運営側が強制停止 | false | false |