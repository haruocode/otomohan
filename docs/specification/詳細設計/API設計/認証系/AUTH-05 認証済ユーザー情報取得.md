# AUTH-05 認証済ユーザー情報取得（GET /auth/me）

この API は、アプリ起動時・ログイン直後・プロフィール画面表示時などに**現在ログインしているユーザーの情報を返す標準 API** です。

リアルタイム通話サービス「おともはん」では User と Otomo の両方で利用するため、ロール（role）やステータス情報なども含めて返す構成が適切です。

---

# 1. API 概要

| 項目           | 内容                                   |
| -------------- | -------------------------------------- |
| API ID         | **AUTH-05**                            |
| メソッド       | GET                                    |
| エンドポイント | `/auth/me`                             |
| 認証           | 必須（JWT）                            |
| 目的           | 現在のログインユーザーの基本情報を返す |

---

# 2. レスポンス例（User の場合）

```json
{
  "status": "success",
  "user": {
    "id": "user-123",
    "role": "user",
    "name": "たろう",
    "avatar": "/avatars/u1.jpg",
    "balance": 1200
  }
}
```

---

# 3. レスポンス例（Otomo の場合）

```json
{
  "status": "success",
  "user": {
    "id": "otomo-555",
    "role": "otomo",
    "name": "みほ",
    "avatar": "/avatars/o5.jpg",
    "status": "online",
    "balance": 0
  }
}
```

---

# 4. レスポンス項目仕様

| 主要フィールド | 説明                                                           |
| -------------- | -------------------------------------------------------------- |
| id             | ユーザー ID                                                    |
| role           | `"user"` or `"otomo"`                                          |
| name           | 表示名                                                         |
| avatar         | プロフィール画像 URL                                           |
| balance        | ユーザーのポイント残高（User のみ必須）                        |
| status         | おともはんのステータス（online/busy/offline/break）※Otomo のみ |

---

# 5. 取得データの判定ロジック

JWT の payload に格納されている：

- userId
- role

をもとに DB から情報を取得。

---

## ■ User の場合（一般ユーザー）

```sql
SELECT id, name, avatar_url, balance
FROM users
WHERE id = $1;
```

---

## ■ Otomo の場合（おともはん）

```sql
SELECT o.id, o.name, o.avatar_url, s.status
FROM otomo o
LEFT JOIN otomo_status s ON s.user_id = o.id
WHERE o.id = $1;
```

※ balance は持たない（ポイント制ではないため）

---

# 6. エラーレスポンス

| 状況                    | ステータス | error          |
| ----------------------- | ---------- | -------------- |
| JWT 無効                | 401        | UNAUTHORIZED   |
| DB にユーザー存在しない | 404        | USER_NOT_FOUND |

### エラー例（JWT 無効）

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
app.get("/auth/me", async (req, reply) => {
  const { userId, role } = req.user;

  if (role === "user") {
    const row = await db.query(
      `SELECT id, name, avatar_url, balance
       FROM users WHERE id = $1`,
      [userId],
    );

    if (row.rowCount === 0) {
      return reply.code(404).send({
        status: "error",
        error: "USER_NOT_FOUND",
      });
    }

    return reply.send({
      status: "success",
      user: {
        id: row.rows[0].id,
        role: "user",
        name: row.rows[0].name,
        avatar: row.rows[0].avatar_url,
        balance: row.rows[0].balance,
      },
    });
  }

  // Otomo 用
  const row = await db.query(
    `SELECT o.id, o.name, o.avatar_url, s.status
     FROM otomo o
     LEFT JOIN otomo_status s ON s.user_id = o.id
     WHERE o.id = $1`,
    [userId],
  );

  return reply.send({
    status: "success",
    user: {
      id: row.rows[0].id,
      role: "otomo",
      name: row.rows[0].name,
      avatar: row.rows[0].avatar_url,
      status: row.rows[0].status,
    },
  });
});
```

---

# 8. /auth/me を呼ぶ最適なタイミング（重要）

- アプリ起動直後（自動ログイン判定）
- ログイン直後（User 情報取得）
- WebSocket 接続前（userId / role 確定のため）
- マイページ編集前
- U-01（一覧画面）表示時の自分の current 状態確認

特に WebSocket 接続前に**userId を確定しておくことがとても重要**。

---

# 9. /auth/me が果たす役割（まとめ）

AUTH-05 は安全でシンプルですが、アプリ全体で必須となる基盤 API。

役割：

- ログインセッションの検証
- ロール判定（User or Otomo）
- プロフィール情報の提供
- 残高（balance）の同期
- おともはん status の初期化
- WebSocket 接続前の前提情報として利用

アプリの「起動時の初期同期」を支える重要なエンドポイント。
