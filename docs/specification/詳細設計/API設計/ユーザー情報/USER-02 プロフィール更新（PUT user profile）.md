# USER-02 プロフィール更新（PUT /user/profile）

これはユーザーが「名前」「自己紹介（bio）」などを編集するための API で、U-11（プロフィール編集画面）から利用されます。

---

# 1. API 概要

| 項目 | 内容 |
| --- | --- |
| API ID | **USER-02** |
| メソッド | PUT |
| エンドポイント | `/user/profile` |
| 認証 | 必須（JWT） |
| 役割 | ユーザーの基本プロフィール（表示名・自己紹介）の更新 |

---

# 2. リクエスト仕様

### Body（例）

```json
{
  "name": "たろう",
  "bio": "よろしくお願いします！"
}
```

### フィールド仕様

| フィールド | 型 | 必須 | 説明 | バリデーション |
| --- | --- | --- | --- | --- |
| name | string | 任意 | 表示名 | 1〜50文字 |
| bio | string | 任意 | 自己紹介 | 0〜200文字 |

※ **部分更新（PATCH 的挙動）** とする：

→ 渡された値だけ更新し、未指定は変更しない。

---

# 3. バリデーションルール（サーバ側）

### name

- 空文字不可
- 1〜50文字
- 絵文字や特殊文字は許容（サービス設計次第）

### bio

- 最大 200文字
- 改行 OK
- script タグ等はサニタイズ（XSS防止）

---

# 4. 成功レスポンス

```json
{
  "status": "success",
  "user": {
    "id": "user-123",
    "name": "たろう",
    "bio": "よろしくお願いします！"
  }
}
```

---

# 5. エラーレスポンス

### name が長すぎる場合

```json
{
  "status": "error",
  "error": "INVALID_NAME",
  "message": "Name must be 1-50 characters."
}
```

### bio が長すぎる場合

```json
{
  "status": "error",
  "error": "INVALID_BIO",
  "message": "Bio must be 200 characters or less."
}
```

### 権限エラー（Otomo がアクセスした場合）

```json
{
  "status": "error",
  "error": "FORBIDDEN",
  "message": "This endpoint is for user role only."
}
```

---

# 6. DB 更新クエリ

```sql
UPDATE users
SET
  name = COALESCE($2, name),
  bio = COALESCE($3, bio),
  updated_at = NOW()
WHERE id = $1
RETURNING id, name, bio;
```

---

# 7. Fastify + TypeScript 擬似実装

```tsx
app.put('/user/profile', async (req, reply) => {
  const { userId, role } = req.user;

  if (role !== "user") {
    return reply.code(403).send({
      status: "error",
      error: "FORBIDDEN",
      message: "This endpoint is for user role only."
    });
  }

  const { name, bio } = req.body;

  // Validation
  if (name !== undefined && (name.length < 1 || name.length > 50)) {
    return reply.code(400).send({
      status: "error",
      error: "INVALID_NAME"
    });
  }

  if (bio !== undefined && bio.length > 200) {
    return reply.code(400).send({
      status: "error",
      error: "INVALID_BIO"
    });
  }

  const row = await db.query(
    `UPDATE users
     SET name = COALESCE($2, name),
         bio = COALESCE($3, bio),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, bio`,
    [userId, name ?? null, bio ?? null]
  );

  return reply.send({
    status: "success",
    user: row.rows[0]
  });
});
```

---

# 8. この API が利用される画面

| 画面 ID | 用途 |
| --- | --- |
| **U-11** | プロフィール編集 |
| U-01（一部） | 自分の名前表示更新 |
| 通話履歴 | 表示名更新が即時反映 |

更新後はフロント側で **me 情報を再フェッチ** するのが自然です。

---

# 9. 補足：アバター変更は別 API に切り出すのが良い

画像アップロードは multipart、ストレージ、CDN が絡むため以下のように別にするのが推奨：

```
USER-03 PUT /user/avatar
```

（後で設計可能）

---

# まとめ

USER-02 は「ユーザーの基本情報を更新する」シンプルな API だが、

- name / bio の部分更新
- role ごとのアクセス権
- バリデーション
- 更新後の即時 UI 反映
- /auth/me や /user/me と組み合わせて利用

という形で、アプリ体験の中心となる重要な API。