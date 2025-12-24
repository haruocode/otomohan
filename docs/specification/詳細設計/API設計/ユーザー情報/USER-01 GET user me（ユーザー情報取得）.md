# USER-01 GET /user/me（ユーザー情報取得）

この API は「AUTH-05 /auth/me」と似ていますが、役割が異なる：

---

# AUTH-05 と USER-01 の違い

| API                  | 目的                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------ |
| **AUTH-05 /auth/me** | 認証済みユーザーの最小限の情報（id, role, balance など）を返す「セッション確認 API」 |
| **USER-01 /user/me** | プロフィール編集やマイページで使用する “拡張ユーザー情報” を返す API                 |

つまり USER-01 は**プロフィール関連情報をまとめて返す**という位置付け。

---

# 1. API 概要

| 項目           | 内容                                                                 |
| -------------- | -------------------------------------------------------------------- |
| API ID         | **USER-01**                                                          |
| メソッド       | GET                                                                  |
| エンドポイント | `/user/me`                                                           |
| 認証           | 必須（JWT）                                                          |
| 説明           | プロフィール情報・課金情報・通知設定など、ユーザーの全体像を取得する |

---

# 2. レスポンス例（User ロール）

```json
{
  "status": "success",
  "user": {
    "id": "user-123",
    "role": "user",
    "name": "たろう",
    "avatar": "/avatars/user-123.png",
    "bio": "よろしくお願いします！",
    "gender": "male",
    "birthday": "1995-03-10",
    "balance": 1200,
    "notifications": {
      "incomingCall": true,
      "callSummary": true,
      "walletAlert": true,
      "marketing": false
    }
  }
}
```

---

# 3. User のレスポンス項目仕様

| 項目          | 型          | 説明                      |
| ------------- | ----------- | ------------------------- |
| id            | string      | ユーザー ID               |
| role          | string      | `"user"` 固定             |
| name          | string      | 表示名                    |
| avatar        | string      | プロフィール画像 URL      |
| bio           | string      | 自己紹介（任意）          |
| gender        | string/null | 性別設定（任意）          |
| birthday      | date/null   | 誕生日（任意）            |
| balance       | number      | ポイント残高              |
| notifications | object      | 通知設定（SET-02 と同じ） |

---

# 4. Otomo の場合（※ USER 用 API なので返さない）

/user/me は **User 専用** とします。

（Otomo は別 API `/otomo/me` を用意する設計にするのが自然）

もし誤って Otomo がアクセスした場合：

```json
{
  "status": "error",
  "error": "FORBIDDEN",
  "message": "This endpoint is for user role only."
}
```

---

# 5. DB 参照一覧

### users テーブル

| カラム     | 説明         |
| ---------- | ------------ |
| id         | user ID      |
| name       | 表示名       |
| avatar_url | 画像 URL     |
| bio        | 自己紹介     |
| gender     | 性別         |
| birthday   | 誕生日       |
| balance    | ポイント残高 |

---

### user_settings（通知設定）

```sql
SELECT notifications
FROM user_settings
WHERE user_id = $1;
```

---

### users テーブル

```sql
SELECT id, name, avatar_url, bio, gender, birthday, balance
FROM users
WHERE id = $1;
```

---

# 6. Fastify + TypeScript 実装例

```tsx
app.get("/user/me", async (req, reply) => {
  const { userId, role } = req.user;

  // User専用
  if (role !== "user") {
    return reply.code(403).send({
      status: "error",
      error: "FORBIDDEN",
      message: "This endpoint is for user role only.",
    });
  }

  // users 取得
  const userRow = await db.query(
    `SELECT id, name, avatar_url, bio, gender, birthday, balance
     FROM users WHERE id = $1`,
    [userId],
  );

  if (userRow.rowCount === 0) {
    return reply.code(404).send({
      status: "error",
      error: "USER_NOT_FOUND",
    });
  }

  // 通知設定取得
  const settingsRow = await db.query(
    `SELECT notifications
     FROM user_settings WHERE user_id = $1`,
    [userId],
  );

  const user = userRow.rows[0];

  return reply.send({
    status: "success",
    user: {
      id: user.id,
      role: "user",
      name: user.name,
      avatar: user.avatar_url,
      bio: user.bio,
      gender: user.gender,
      birthday: user.birthday,
      balance: user.balance,
      notifications: settingsRow.rows[0]?.notifications || {},
    },
  });
});
```

---

# 7. この API を使う画面

| 画面 ID | 画面名                   |
| ------- | ------------------------ |
| U-11    | プロフィール編集画面     |
| U-06    | ウォレット               |
| C-04    | 設定（通知設定の初期値） |
| U-01    | 一部で自分の表示名に使用 |

---

# 8. エラーレスポンス

| 状況                 | ステータス | error          |
| -------------------- | ---------- | -------------- |
| JWT 無効             | 401        | UNAUTHORIZED   |
| ユーザー見つからない | 404        | USER_NOT_FOUND |
| Otomo がアクセス     | 403        | FORBIDDEN      |

---

# 9. この API の役割（まとめ）

`/user/me` は**アプリのユーザープロフィールに必要な多くの情報を単一 API で提供** するため、

- 初期ロードが高速になる
- マイページ編集と設定画面を一貫して扱える
- balance / notifications を即座に同期できる
- WebSocket 前の前提情報としても利用可能

という重要な役割を担います。
