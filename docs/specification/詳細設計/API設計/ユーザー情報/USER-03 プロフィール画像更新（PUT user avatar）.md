# USER-03 プロフィール画像更新（PUT /user/avatar）

この API は U-11（プロフィール編集）で利用される、**ユーザーのアバター（プロフィール画像）を更新する専用 API** です。

画像アップロードはテキスト API と大きく異なるため、`multipart/form-data` でのアップロード

＋

ストレージ（S3 / Supabase Storage / Cloudflare R2）保存

＋

DB の avatar_url 更新

っていう流れです。

---

# 1. API 概要

| 項目           | 内容                             |
| -------------- | -------------------------------- |
| API ID         | **USER-03**                      |
| メソッド       | PUT                              |
| エンドポイント | `/user/avatar`                   |
| 認証           | 必須（JWT）                      |
| フォーマット   | multipart/form-data              |
| 目的           | ユーザーのプロフィール画像の変更 |

---

# 2. リクエスト仕様

### Content-Type

```
Content-Type: multipart/form-data
```

### フィールド

| フィールド | 型           | 必須 | 説明                   |
| ---------- | ------------ | ---- | ---------------------- |
| avatar     | file(binary) | ○    | 新しいプロフィール画像 |

---

# 3. 受け入れる画像形式

- JPEG / JPG
- PNG
- WebP（推奨）
- HEIC（サーバ側で対応可能なら）

---

# 4. バリデーションルール

| 項目               | 設定                    |
| ------------------ | ----------------------- |
| 最大ファイルサイズ | 5MB                     |
| 画像の最小サイズ   | 64×64 以上              |
| MIME タイプ        | image/jpeg / png / webp |

※ セキュリティ対策として ImageMagick / Sharp でリサイズ検証を行うのがよい。

---

# 5. ストレージへの保存

推奨パス構成：

```
/avatars/{userId}/{randomFileName}.webp
```

- ユーザー ID でディレクトリ分け
- ランダムファイル名にしてキャッシュ問題を回避
- アップロード後 WebP に強制変換して軽量化（任意）

---

# 6. DB 更新

```sql
UPDATE users
SET avatar_url = $newUrl, updated_at = NOW()
WHERE id = $userId
RETURNING id, avatar_url;
```

---

# 7. 成功レスポンス

```json
{
  "status": "success",
  "avatar": "https://cdn.otmhn.app/avatars/user-123/8sd8f7sdf.webp"
}
```

---

# 8. エラーレスポンス

### 不正 MIME の場合

```json
{
  "status": "error",
  "error": "INVALID_FILE_TYPE",
  "message": "Only image/jpeg, png, webp are allowed."
}
```

### サイズオーバー

```json
{
  "status": "error",
  "error": "FILE_TOO_LARGE",
  "message": "Image must be under 5MB."
}
```

### 処理エラー

```json
{
  "status": "error",
  "error": "UPLOAD_FAILED"
}
```

---

# 9. Fastify + TypeScript 擬似実装例

```tsx
import { randomUUID } from "crypto";
import sharp from "sharp";

app.put("/user/avatar", async (req, reply) => {
  const { userId } = req.user;

  const data = await req.file(); // fastify-multipart
  if (!data) {
    return reply.code(400).send({
      status: "error",
      error: "NO_FILE",
    });
  }

  // Validate size
  if (data.file.bytesRead > 5 * 1024 * 1024) {
    return reply.code(400).send({
      status: "error",
      error: "FILE_TOO_LARGE",
    });
  }

  // Validate mime
  if (!["image/jpeg", "image/png", "image/webp"].includes(data.mimetype)) {
    return reply.code(400).send({
      status: "error",
      error: "INVALID_FILE_TYPE",
    });
  }

  // Convert to WebP
  const buffer = await sharp(await data.toBuffer())
    .resize(256, 256, { fit: "cover" })
    .webp()
    .toBuffer();

  const fileName = randomUUID() + ".webp";

  const url = await storage.upload(
    `avatars/${userId}/${fileName}`,
    buffer,
    "image/webp",
  );

  const row = await db.query(
    `UPDATE users
     SET avatar_url = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, avatar_url`,
    [url, userId],
  );

  reply.send({
    status: "success",
    avatar: row.rows[0].avatar_url,
  });
});
```

---

# 10. フロントエンド側の流れ

1. U-11（プロフィール編集）で画像選択
2. multipart/form-data で PUT /user/avatar に送信
3. 成功レスポンスの avatar URL を反映
4. `/user/me` や `/auth/me` を再フェッチして UI 同期
5. ヘッダーなど表示名・画像が即時更新される

---

# 11. この API の役割（まとめ）

USER-03 はユーザー体験に直接影響する重要 API で、

- プロフィール画像の更新
- 画像アップロード・変換・CDN 配信
- ストレージ管理と DB 更新
- 他の画面にリアルタイム反映

といった UI / UX の中心的役割を担います。

おともはんサービスにおいて「安心・信頼・親しみ」の印象を作るためにもプロフィール画像機能は非常に重要です。
