# CALL-01 通話履歴一覧（GET /calls）

通話履歴はユーザーが「過去に誰と何分話したか」を確認する機能で、ポイント消費の透明性（信頼性）にも直結する。また、おともはん（Otomo）側にも履歴が必要になるため、User / Otomo 両ロールで利用可能な API として設計します。

---

# 1. API 概要

| 項目 | 内容 |
| --- | --- |
| API ID | **CALL-01** |
| メソッド | GET |
| エンドポイント | `/calls` |
| 認証 | 必須（JWT） |
| 対象ロール | User / Otomo どちらでも |
| 目的 | 自分が関わった通話の履歴を一覧取得する |

---

# 2. クエリパラメータ（ページング対応）

```
GET /calls?page=1&limit=20
```

| パラメータ | 説明 | デフォルト |
| --- | --- | --- |
| page | 取得ページ番号 | 1 |
| limit | 1ページあたり件数 | 20 |

※ 無限スクロール対応のため limit 指定可能にする。

---

# 3. レスポンス例（User の場合）

```json
{
  "status": "success",
  "page": 1,
  "limit": 20,
  "calls": [
    {
      "callId": "c123",
      "withUser": {
        "id": "otomo-22",
        "name": "ゆみ",
        "avatar": "/avatars/o22.png"
      },
      "startedAt": "2025-01-10T12:03:20Z",
      "endedAt": "2025-01-10T12:15:20Z",
      "durationSeconds": 720,
      "billedUnits": 12,
      "billedPoints": 1200
    }
  ]
}
```

---

# 4. レスポンス項目仕様

---

## 基本情報

| 項目 | 説明 |
| --- | --- |
| callId | 通話ID |
| withUser | 相手の情報（User → Otomo / Otomo → User） |
| startedAt | 通話開始時刻 |
| endedAt | 通話終了時刻 |
| durationSeconds | 通話秒数 |
| billedUnits | 課金対象の 1分ユニット数 |
| billedPoints | 消費ポイント数（User のみ） |

---

### billedUnits とは？

- 1分ごとに 1ユニット
- WS-S05 (call_tick) でカウントされる
- 例：8分 → 8ユニット

---

### billedPoints とは？

- User の場合：`billedUnits × 100` などの料金設定
- Otomo の場合：表示してもよいが不要なら非表示でもよい

---

# 5. DB 構造（calls, call_billing_units）

### calls テーブル

| カラム | 説明 |
| --- | --- |
| id | callId |
| user_id | ユーザー側 |
| otomo_id | おともはん側 |
| started_at | 開始時刻 |
| ended_at | 終了時刻 |
| duration_seconds | 秒数 |
| total_units | 課金ユニット数 |
| total_points | 総課金ポイント（User のみ） |

---

### call_billing_units

（1分ごとの tick ログ）

| カラム | 説明 |
| --- | --- |
| id | PK |
| call_id | FK calls.id |
| minute_index | 0開始の分番号 |
| charged_points | 100など |

---

# 6. サーバ側の取得ロジック

---

## User の場合

```
SELECT *
FROM calls
WHERE user_id = $userId
ORDER BY started_at DESC
LIMIT $limit OFFSET ($page-1)*$limit;
```

## Otomo の場合

```
SELECT *
FROM calls
WHERE otomo_id = $userId
ORDER BY started_at DESC
LIMIT $limit OFFSET ($page-1)*$limit;
```

---

# 7. withUser の取得

### User が履歴を見るとき

withUser = Otomo 情報

```sql
SELECT id, name, avatar_url
FROM otomo
WHERE id = calls.otomo_id;
```

---

### Otomo が履歴を見るとき

withUser = User 情報

```sql
SELECT id, name, avatar_url
FROM users
WHERE id = calls.user_id;
```

---

# 8. Fastify + TypeScript 擬似実装

```tsx
app.get('/calls', async (req, reply) => {
  const { userId, role } = req.user;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);

  const offset = (page - 1) * limit;

  const where = role === "user"
    ? "user_id = $1"
    : "otomo_id = $1";

  const rows = await db.query(
    `SELECT id, user_id, otomo_id, started_at, ended_at,
            duration_seconds, total_units, total_points
     FROM calls
     WHERE ${where}
     ORDER BY started_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const calls = [];

  for (const r of rows.rows) {
    const otherId = role === "user" ? r.otomo_id : r.user_id;

    const other = await db.query(
      role === "user"
        ? `SELECT id, name, avatar_url FROM otomo WHERE id=$1`
        : `SELECT id, name, avatar_url FROM users WHERE id=$1`,
      [otherId]
    );

    calls.push({
      callId: r.id,
      withUser: {
        id: other.rows[0].id,
        name: other.rows[0].name,
        avatar: other.rows[0].avatar_url
      },
      startedAt: r.started_at,
      endedAt: r.ended_at,
      durationSeconds: r.duration_seconds,
      billedUnits: r.total_units,
      billedPoints: r.total_points
    });
  }

  reply.send({
    status: "success",
    page,
    limit,
    calls
  });
});

```

---

# 9. この API の役割（サービス面）

通話履歴はユーザーの信頼に直結する。

- 不正な課金がないことを確認できる
- 会話の長さとポイント消費がわかる
- Otomo 側の業務実績にも活用可能
- サポート問い合わせの基礎データとして重要

---

# 次は CALL-02（通話詳細）も作成しますか？

候補：

- **CALL-02** 通話詳細（billing_units 含む）
- WAL-03 ポイント購入 API
- WS-C03 call_reject
- WS-S03 call_rejected

どれに進めましょうか？