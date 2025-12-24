# CALL-02 通話履歴詳細（GET /calls/{callId}）

この API は **U-09（通話詳細画面）** で使用され、「通話時間・課金情報・1 分ごとの billing ユニット」などユーザーにとって非常に重要な情報を提供します。

---

# 1. API 概要

| 項目           | 内容                                              |
| -------------- | ------------------------------------------------- |
| API ID         | **CALL-02**                                       |
| メソッド       | GET                                               |
| エンドポイント | `/calls/{callId}`                                 |
| 認証           | 必須（JWT）                                       |
| 対象ロール     | User / Otomo                                      |
| 目的           | 通話の詳細情報（時間・課金・billing units）を取得 |

---

# 2. レスポンス例（User 視点）

```json
{
  "status": "success",
  "call": {
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
    "billedPoints": 1200,
    "billingUnits": [
      {
        "minute": 0,
        "chargedPoints": 100,
        "timestamp": "2025-01-10T12:04:20Z"
      },
      {
        "minute": 1,
        "chargedPoints": 100,
        "timestamp": "2025-01-10T12:05:20Z"
      }
    ]
  }
}
```

---

# 3. 含まれる情報

| 項目            | 説明                                  |
| --------------- | ------------------------------------- |
| callId          | 通話 ID                               |
| withUser        | 相手側（User ←→ Otomo）の情報         |
| startedAt       | 開始時刻                              |
| endedAt         | 終了時刻                              |
| durationSeconds | 通話秒数                              |
| billedUnits     | 課金ユニット（分単位）                |
| billedPoints    | トータル課金ポイント                  |
| billingUnits    | 1 分ごと課金ログ（WS-S05 の保存結果） |

---

# 4. billingUnits の構造（1 分ごとの tick ログ）

billingUnits は WS-S05 で記録される課金ログ。

| フィールド    | 説明                                   |
| ------------- | -------------------------------------- |
| minute        | 0 開始の minute index                  |
| chargedPoints | 1 分ごとに請求したポイント（通常 100） |
| timestamp     | 課金処理された実タイムスタンプ         |

※ これを見れば「いつ何ポイント消費したか」が一目でわかる。

---

# 5. DB テーブル参照

---

## calls テーブル

```sql
SELECT id, user_id, otomo_id, started_at, ended_at,
       duration_seconds, total_units, total_points
FROM calls
WHERE id = $1;
```

---

## call_billing_units テーブル

```sql
SELECT minute_index, charged_points, created_at
FROM call_billing_units
WHERE call_id = $1
ORDER BY minute_index ASC;
```

---

## 相手のプロフィール取得

User 視点 → Otomo 情報

Otomo 視点 → User 情報

```sql
SELECT id, name, avatar_url FROM otomo WHERE id = $otomoId;
```

または

```sql
SELECT id, name, avatar_url FROM users WHERE id = $userId;
```

---

# 6. アクセス権チェック（重要）

User / Otomo どちらでも利用可だが、**当該通話の当事者でなければ 403**

```sql
SELECT 1
FROM calls
WHERE id=$callId AND (user_id=$currentUser OR otomo_id=$currentUser);
```

該当なし → forbidden

---

# 7. エラーレスポンス

### 通話 ID が無効

```json
{
  "status": "error",
  "error": "CALL_NOT_FOUND"
}
```

### 当事者ではない

```json
{
  "status": "error",
  "error": "FORBIDDEN",
  "message": "You are not allowed to view this call."
}
```

---

# 8. Fastify + TypeScript 擬似実装

```tsx
app.get("/calls/:callId", async (req, reply) => {
  const { callId } = req.params;
  const { userId, role } = req.user;

  // ① 通話取得
  const callRow = await db.query(
    `SELECT id, user_id, otomo_id, started_at, ended_at,
            duration_seconds, total_units, total_points
     FROM calls WHERE id = $1`,
    [callId],
  );

  if (callRow.rowCount === 0) {
    return reply.code(404).send({
      status: "error",
      error: "CALL_NOT_FOUND",
    });
  }

  const call = callRow.rows[0];

  // ② アクセス権チェック
  if (call.user_id !== userId && call.otomo_id !== userId) {
    return reply.code(403).send({
      status: "error",
      error: "FORBIDDEN",
    });
  }

  // ③ 相手の情報を取得
  const otherId = call.user_id === userId ? call.otomo_id : call.user_id;

  const other = await db.query(
    call.user_id === userId
      ? `SELECT id, name, avatar_url FROM otomo WHERE id=$1`
      : `SELECT id, name, avatar_url FROM users WHERE id=$1`,
    [otherId],
  );

  // ④ billingUnit 取得
  const billingRows = await db.query(
    `SELECT minute_index, charged_points, created_at
     FROM call_billing_units
     WHERE call_id = $1
     ORDER BY minute_index ASC`,
    [callId],
  );

  const billingUnits = billingRows.rows.map((r) => ({
    minute: r.minute_index,
    chargedPoints: r.charged_points,
    timestamp: r.created_at,
  }));

  return reply.send({
    status: "success",
    call: {
      callId: call.id,
      withUser: {
        id: other.rows[0].id,
        name: other.rows[0].name,
        avatar: other.rows[0].avatar_url,
      },
      startedAt: call.started_at,
      endedAt: call.ended_at,
      durationSeconds: call.duration_seconds,
      billedUnits: call.total_units,
      billedPoints: call.total_points,
      billingUnits,
    },
  });
});
```

---

# 9. U-09（通話詳細画面）の表示項目（参考）

- 相手の名前 / アイコン
- 通話時間
- 総課金ポイント
- 課金の内訳（1 分ごとの tick）
- 通話開始 / 終了のタイムスタンプ

課金透明性を高めるため、billingUnits の一覧はとても重要。

---

# まとめ

CALL-02 通話詳細 API は、

- 「課金が正確に行われていること」を見える化
- 「ユーザーの不安を消す UI」を構築
- 「サポート対応の根拠データ」を提供
