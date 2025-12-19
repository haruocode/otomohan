# AUTH-03 ログアウト（POST /auth/logout）

Web アプリやネイティブアプリでは「ログアウト」は比較的シンプルに見えますが、リアルタイムサービス（WebSocket 通話サービス）では**セッション終了＋WebSocket 切断＋ステータス更新（otomo の場合）**など複数処理が絡むため、しっかり定義しておく必要があります。

---

# 1. API 概要

| 項目 | 内容 |
| --- | --- |
| API ID | **AUTH-03** |
| メソッド | POST |
| エンドポイント | `/auth/logout` |
| 認証 | 必須（JWT） |
| 目的 | ・JWT セッションの無効化（サーバ側管理の場合）
・クライアント側のアクセストークン削除
・WebSocket 切断の誘導
・Otomo の場合はステータスを `offline` に更新 |

---

# 2. リクエスト（クライアント → サーバ）

```
POST /auth/logout
Authorization: Bearer <token>
```

body は不要。

---

# 3. 実装パターン（サーバのトークン管理方式によって変わる）

### おともはん「リアルタイム通話サービス」では以下の方針が最適：

## ✔ 「サーバ側ブラックリスト方式」は **不要**

JWT は stateless に扱い、ログアウト時に**クライアント側の token を破棄するだけ**という構成が最もシンプルでスケーラブルです。

そのため、POST /auth/logout では：

- セッション DB を使わない
- クライアントの token を削除するだけで OK
- サーバは「成功」を返すだけ

---

# 4. レスポンス（成功）

```json
{
  "status": "success"
}
```

---

# 5. サーバ側で行うこと（アプリ仕様に合わせて）

ユーザー種別によって挙動が異なります。

---

## ■ User（一般ユーザー）の場合

- 特にサーバ側で行うことなし
- ただし WebSocket 接続が残っている場合、クライアント側で close する必要あり

---

## ■ Otomo（おともはん）の場合 ← *重要*

ログアウトは「待機終了」扱いとなるため：

### 1. `otomo_status` を offline に更新

```sql
UPDATE otomo_status
SET status = 'offline'
WHERE user_id = $userId;
```

### 2. WS-S08（otomo_status_update）で全クライアントに通知

```json
{
  "type": "otomo_status_update",
  "userId": "otomo-123",
  "status": "offline",
  "timestamp": 1706606000
}
```

### 3. WebSocket 切断はクライアント任せ

（※ログアウト API のレスポンス後、クライアント側で ws.close() する）

---

# 6. エラーレスポンス

| 状況 | ステータス | エラーコード | 説明 |
| --- | --- | --- | --- |
| JWT 無効 | 401 | UNAUTHORIZED | token が無効 |
| DB エラー | 500 | DB_ERROR | ※Otomo 状態更新時 |

---

### エラーレスポンス例：

```json
{
  "status": "error",
  "error": "UNAUTHORIZED",
  "message": "Authentication required."
}
```

---

# 7. Fastify + TypeScript 擬似実装

```tsx
app.post('/auth/logout', async (req, reply) => {
  const userId = req.user.userId;
  const role = req.user.role; // 'user' | 'otomo'

  if (role === 'otomo') {
    await db.query(
      `UPDATE otomo_status SET status = 'offline' WHERE user_id = $1`,
      [userId]
    );

    wsManager.broadcastToAll(JSON.stringify({
      type: "otomo_status_update",
      userId,
      status: "offline",
      timestamp: Math.floor(Date.now() / 1000)
    }));
  }

  return reply.send({ status: 'success' });
});
```

---

# 8. フロントエンド側での処理（重要）

### 1. JWT の削除

```
localStorage.removeItem("accessToken");
```

### 2. WebSocket の切断

```
ws.close();
```

### 3. ログイン画面へ遷移

```
router.push("/login");
```

---

# 9. この API の重要性（まとめ）

AUTH-03 logout は単純に見えつつ、

**リアルタイム通話サービスでは重要な意味を持つ**。

- Otomo の状態を “offline” にする
- 一覧画面（U-01）を即時更新するために WS-S08 を発火
- WebSocket のクリア処理と整合性を保つ
- トークン破棄によりセキュリティ担保
- 通話中ログアウトは不可（→ call_end を優先）

サービスとしての一貫性と健全性に必須の API です。