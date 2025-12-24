# OTOMO-01：GET /otomo/list（おともはん一覧取得）

要件として想定している内容：

- おともはん（話し相手）一覧を取得する
- 絞り込み（オンライン／オフライン、年齢、性別、対応ジャンル…など）が将来的に入りうる
- クライアントは Web（Fastify + TypeScript）から呼び出す
- 認証は Supabase Auth を利用予定 → アクセストークン（JWT）を `Authorization: Bearer` で送る

---

# OTOMO-01：GET /otomo/list（おともはん一覧取得）

## 目的

ユーザーが現在選択可能なおともはん一覧を取得する。

一覧には基本プロフィール情報・通話可否・料金などのメタ情報を含める。

---

# エンドポイント仕様

### **Method**

```
GET /otomo/list
```

### **認証**

- 必須（Supabase Auth の JWT）
- Header:

```
Authorization: Bearer <token>

```

### **クエリパラメータ（任意）**

| パラメータ | 型      | 例        | 説明                                       |
| ---------- | ------- | --------- | ------------------------------------------ |
| `isOnline` | boolean | `true`    | オンライン中のおともはんのみ取得           |
| `genre`    | string  | `healing` | 得意ジャンル（例：雑談、愚痴聞き、癒し系） |
| `minAge`   | number  | `20`      | 年齢下限                                   |
| `maxAge`   | number  | `40`      | 年齢上限                                   |
| `limit`    | number  | `20`      | 取得件数                                   |
| `offset`   | number  | `0`       | ページング                                 |

（※将来的に検索 UI を追加しやすいように設置だけしておく）

---

# **レスポンス仕様（成功時）**

### **Status: 200 OK**

```json
{
  "items": [
    {
      "otomoId": "otomo_001",
      "displayName": "みさき",
      "profileImageUrl": "https://example.com/img/001.jpg",
      "age": 25,
      "gender": "female",
      "genres": ["healing", "talk", "consult"],
      "isOnline": true,
      "isAvailable": true,
      "pricePerMinute": 120,
      "rating": 4.8,
      "reviewCount": 54
    }
  ],
  "total": 1
}
```

### 各フィールドの意味

| 項目              | 型       | 説明                                      |
| ----------------- | -------- | ----------------------------------------- |
| `otomoId`         | string   | おともはん ID                             |
| `displayName`     | string   | 表示名                                    |
| `profileImageUrl` | string   | アイコン画像 URL                          |
| `age`             | number   | 年齢                                      |
| `gender`          | `"male"  | "female"                                  |
| `genres`          | string[] | 得意ジャンル                              |
| `isOnline`        | boolean  | オンライン状態                            |
| `isAvailable`     | boolean  | 通話可能か（=他のユーザーと通話中でない） |
| `pricePerMinute`  | number   | 1 分あたり料金                            |
| `rating`          | number   | 平均評価                                  |
| `reviewCount`     | number   | レビュー件数                              |
| `total`           | number   | 一覧全体の件数（ページング用）            |

---

# **レスポンス例（おともはんが複数）**

```json
{
  "items": [
    {
      "otomoId": "otomo_001",
      "displayName": "みさき",
      "profileImageUrl": "https://cdn.example.com/otomo/001.jpg",
      "age": 25,
      "gender": "female",
      "genres": ["healing", "talk"],
      "isOnline": true,
      "isAvailable": true,
      "pricePerMinute": 120,
      "rating": 4.8,
      "reviewCount": 54
    },
    {
      "otomoId": "otomo_002",
      "displayName": "ゆうと",
      "profileImageUrl": "https://cdn.example.com/otomo/002.jpg",
      "age": 28,
      "gender": "male",
      "genres": ["consult"],
      "isOnline": false,
      "isAvailable": false,
      "pricePerMinute": 100,
      "rating": 4.5,
      "reviewCount": 30
    }
  ],
  "total": 2
}
```

---

# **Fastify（TypeScript）側のハンドラ例**

```tsx
import { FastifyInstance } from "fastify";

export async function registerOtomoRoutes(fastify: FastifyInstance) {
  fastify.get("/otomo/list", async (request, reply) => {
    const user = request.user; // Supabase Auth ミドルウェアから取得

    const {
      isOnline,
      genre,
      minAge,
      maxAge,
      limit = 20,
      offset = 0,
    } = request.query as {
      isOnline?: boolean;
      genre?: string;
      minAge?: number;
      maxAge?: number;
      limit?: number;
      offset?: number;
    };

    const items = await fastify.db.otomo.findMany({
      where: {
        isOnline: isOnline ?? undefined,
        genres: genre ? { has: genre } : undefined,
        age: {
          gte: minAge ?? undefined,
          lte: maxAge ?? undefined,
        },
      },
      take: limit,
      skip: offset,
    });

    const total = await fastify.db.otomo.count();

    return reply.send({ items, total });
  });
}
```
