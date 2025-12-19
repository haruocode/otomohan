# CALL-03 課金明細取得（GET /calls/{callId}/billing）

この API は **CALL-02（通話詳細）を細分化した専用エンドポイント** であり、U-09（通話詳細画面）内で **「1分ごとの課金ログだけ再取得したい」** 場面に使えます。

特に以下で有効である。

- 通話終了後に明細部分だけ更新
- ポイントサマリーとの不整合確認
- サポート用の課金レコード照会

---

# 1. API 概要

| 項目 | 内容 |
| --- | --- |
| API ID | **CALL-03** |
| メソッド | GET |
| パス | `/calls/{callId}/billing` |
| 認証 | 必須（JWT） |
| 対象ロール | User / Otomo |
| 目的 | 1分ごとの billing_units（課金ログ）の取得 |

---

# 2. レスポンス例

```json
{
  "status": "success",
  "callId": "c123",
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
    },
    {
      "minute": 2,
      "chargedPoints": 100,
      "timestamp": "2025-01-10T12:06:20Z"
    }
  ]
}
```

---

# 3. billingUnits のフィールド仕様

| フィールド | 型 | 説明 |
| --- | --- | --- |
| minute | number | 0始まりの minute index |
| chargedPoints | number | 1分ごとに課金されたポイント |
| timestamp | string | 課金処理された時刻（WS-S05 時の created_at） |

---

# 4. アクセス権チェック（必須）

User / Otomo どちらでも利用可だが、**当該通話の当事者でない場合は 403 Forbidden**

```sql
SELECT 1 FROM calls
WHERE id=$callId AND (user_id=$currentUser OR otomo_id=$currentUser)
```

なければ 403。

---

# 5. DB 構造（call_billing_units）

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | uuid | PK |
| call_id | uuid | calls.id |
| minute_index | int | 0-origin minute |
| charged_points | int | 課金ポイント |
| created_at | timestamp | 課金処理時刻 |

---

# 6. SQL（課金明細取得）

```sql
SELECT minute_index, charged_points, created_at
FROM call_billing_units
WHERE call_id = $1
ORDER BY minute_index ASC;
```

---

# 7. 成功レスポンス（再掲）

```json
{
  "status": "success",
  "callId": "c123",
  "billingUnits": [
    {
      "minute": 0,
      "chargedPoints": 100,
      "timestamp": "2025-01-10T12:04:20Z"
    }
  ]
}
```

---

# 8. エラーレスポンス

### 通話が存在しない

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

# 9. Fastify + TypeScript 擬似実装

```tsx
app.get('/calls/:callId/billing', async (req, reply) => {
  const { callId } = req.params;
  const { userId } = req.user;

  // 通話が存在するか確認
  const callRow = await db.query(
    `SELECT user_id, otomo_id
     FROM calls
     WHERE id = $1`,
    [callId]
  );

  if (callRow.rowCount === 0) {
    return reply.code(404).send({
      status: "error",
      error: "CALL_NOT_FOUND"
    });
  }

  // アクセス権チェック
  const call = callRow.rows[0];
  if (call.user_id !== userId && call.otomo_id !== userId) {
    return reply.code(403).send({
      status: "error",
      error: "FORBIDDEN"
    });
  }

  // billing_units 取得
  const rows = await db.query(
    `SELECT minute_index, charged_points, created_at
     FROM call_billing_units
     WHERE call_id = $1
     ORDER BY minute_index ASC`,
    [callId]
  );

  return reply.send({
    status: "success",
    callId,
    billingUnits: rows.rows.map(r => ({
      minute: r.minute_index,
      chargedPoints: r.charged_points,
      timestamp: r.created_at
    }))
  });
});
```

---

# 10. U-09（通話詳細画面）での利用イメージ

- 初回表示：CALL-02（通話詳細）で全データ取得
- 「課金明細を更新」ボタン → CALL-03 だけ再取得
- モーダルで「課金の詳細を確認」UI
- 不正課金相談時にサポートが確認する際にも活用可

---

# 11. CALL-01 / CALL-02 との違い

| API | 内容 | 役割 |
| --- | --- | --- |
| CALL-01 | 通話履歴一覧 | 一覧表示（サマリー） |
| CALL-02 | 通話詳細 | 全情報（withUser, totalUnits, totalPoints など） |
| **CALL-03** | **billingUnitsのみ取得** | 課金の透明性・内訳確認 |

CALL-03 は軽量で更新頻度が高い場面で有用。

---

# まとめ

CALL-03 は「課金透明性」を支える、顧客満足度の高い API である。

- 1分ごとの課金ログを正確に取得
- User / Otomo 共通の詳細確認
- 「いつ」「何ポイント」消費されたかを可視化
- サポート（返金・調査対応）で必須