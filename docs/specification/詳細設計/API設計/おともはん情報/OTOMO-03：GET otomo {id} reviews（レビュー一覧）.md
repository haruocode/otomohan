# OTOMO-03：GET /otomo/{id}/reviews（レビュー一覧）

この API は、**OTOMO-02（詳細）では「直近数件のみ」返すレビューを、ページング込みで全件取得したい場合に使う**想定です。

---

## 目的

特定のおともはんに対するレビューを、

**ページング可能な一覧形式で取得**する。

---

# エンドポイント仕様

### **Method**

```
GET /otomo/{id}/reviews
```

### **認証**

- 必須（Supabase Auth の JWT）
- Header:

```
Authorization: Bearer <token>
```

### **パスパラメータ**

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `id` | string | おともはんID |

---

# クエリパラメータ（任意）

| パラメータ | 型 | 初期値 | 説明 |
| --- | --- | --- | --- |
| `limit` | number | `20` | 取得件数 |
| `offset` | number | `0` | ページング用オフセット |
| `sort` | `"newest" | "highest" | "lowest"` | `"newest"` | 並び順 |

---

# レスポンス仕様（成功時）

### **Status: 200 OK**

```json
{
  "items": [
    {
      "reviewId": "rev_001",
      "userDisplayName": "たかはるさん",
      "score": 5,
      "comment": "とても癒されました！",
      "createdAt": "2025-01-10T12:00:00Z"
    }
  ],
  "total": 1
}
```

---

# 各フィールド説明

### items[]

| フィールド | 型 | 内容 |
| --- | --- | --- |
| `reviewId` | string | レビューID |
| `userDisplayName` | string | 表示名（ニックネームなど） |
| `score` | number | 1〜5の評価 |
| `comment` | string | コメント内容 |
| `createdAt` | string | 投稿日 |

---

# 並び順（sort パラメータ）

| sort | 説明 |
| --- | --- |
| `newest` | 投稿日が新しい順（デフォルト） |
| `highest` | スコアが高い順 |
| `lowest` | スコアが低い順 |

---

# エラーレスポンス例

### **404 Not Found**

```json
{
  "error": "OTOMO_NOT_FOUND",
  "message": "指定されたおともはんは存在しません。"
}
```

---

# Fastify（TypeScript）ハンドラ例

```tsx
fastify.get("/otomo/:id/reviews", async (request, reply) => {
  const { id } = request.params as { id: string };

  const { limit = 20, offset = 0, sort = "newest" } = request.query as {
    limit?: number;
    offset?: number;
    sort?: "newest" | "highest" | "lowest";
  };

  const sortOption =
    sort === "highest"
      ? { score: "desc" }
      : sort === "lowest"
      ? { score: "asc" }
      : { createdAt: "desc" };

  // otomo の存在チェック
  const otomoExists = await fastify.db.otomo.findUnique({
    where: { otomoId: id },
    select: { otomoId: true }
  });

  if (!otomoExists) {
    return reply.status(404).send({
      error: "OTOMO_NOT_FOUND",
      message: "指定されたおともはんは存在しません。"
    });
  }

  const items = await fastify.db.review.findMany({
    where: { otomoId: id },
    take: limit,
    skip: offset,
    orderBy: sortOption
  });

  const total = await fastify.db.review.count({
    where: { otomoId: id }
  });

  return reply.send({ items, total });
});
```

---