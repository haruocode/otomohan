# CALL-04 デバッグ用強制終了（POST /calls/debug/end）

この API は **本番環境では無効 / 開発環境のみ有効** とする前提の “特殊 API” で、通話状態が不整合になった場合や、フロントが未完成で通話終了処理を流したい場合の**強制クリーンアップ用途** です。

---

# 1. API 概要

| 項目       | 内容                                   |
| ---------- | -------------------------------------- |
| API ID     | **CALL-04**                            |
| メソッド   | POST                                   |
| パス       | `/calls/debug/end`                     |
| 認証       | 必須（JWT）                            |
| 想定利用者 | ローカル開発・テスター・管理者         |
| 本番環境   | **必ず無効化または管理者限定**         |
| 目的       | 通話状態を強制的に「終了」へ遷移させる |

---

# 2. 想定ユースケース（重要）

- WebSocket が落ちて **call_end の正常処理がされない**
- TURN / WebRTC のバグで **通話が宙ぶらりん**
- フロント未完成で **終了ボタンが作れていない**
- バックエンドの動作検証
  - billing_units が正しく集計されるか
  - WS-S07(call_end) が正しく飛ぶか
  - Otomo status が online に戻るか

開発中は非常に役立つ、重要なユーティリティ機能。

---

# 3. リクエスト仕様

POST ボディで **callId** を指定する。

```json
{
  "callId": "c123"
}
```

---

# 4. 処理内容（本番の call_end とほぼ同じ）

この API の目的は **強制的に通話を終了状態へ持っていくこと**。

そのため、以下の処理をまとめて行う。

---

## (1) calls テーブルの終了処理

```sql
UPDATE calls
SET ended_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at)),
    total_units = (
      SELECT COUNT(*) FROM call_billing_units WHERE call_id = $callId
    ),
    total_points = (
      SELECT COALESCE(SUM(charged_points), 0)
      FROM call_billing_units WHERE call_id = $callId
    )
WHERE id = $callId;
```

---

## (2) otomo_status を online に戻す

```sql
UPDATE otomo_status
SET status = 'online'
WHERE user_id = (SELECT otomo_id FROM calls WHERE id = $callId);
```

---

## (3) WS-S07（call_end）を両者へ送信

```json
{
  "type": "call_end",
  "callId": "c123",
  "reason": "forced_debug_end"
}
```

---

## (4) 残っている WebSocket session をクリーンアップ

（任意）

通話中扱いのソケットを閉じる、内部の call 状態を解放する。

---

# 5. 成功レスポンス

```json
{
  "status": "success",
  "callId": "c123",
  "ended": true
}
```

---

# 6. エラーレスポンス

### callId が存在しない

```json
{
  "status": "error",
  "error": "CALL_NOT_FOUND"
}
```

### 本番環境で禁止

```json
{
  "status": "error",
  "error": "NOT_ALLOWED",
  "message": "This endpoint is disabled in production."
}
```

### 当事者ではない（開発環境ならチェックしなくても OK だが推奨）

```json
{
  "status": "error",
  "error": "FORBIDDEN"
}
```

---

# 7. Fastify + TypeScript 擬似実装

```tsx
app.post("/calls/debug/end", async (req, reply) => {
  if (process.env.NODE_ENV === "production") {
    return reply.code(403).send({
      status: "error",
      error: "NOT_ALLOWED",
      message: "This endpoint is disabled in production.",
    });
  }

  const { callId } = req.body;
  const { userId } = req.user;

  // 通話情報取得
  const callRow = await db.query(
    `SELECT id, user_id, otomo_id, started_at
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

  // （任意）アクセス権チェック
  if (call.user_id !== userId && call.otomo_id !== userId) {
    return reply.code(403).send({
      status: "error",
      error: "FORBIDDEN",
    });
  }

  // ★ calls の終了処理
  await db.query(
    `UPDATE calls
     SET ended_at = NOW(),
         duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at)),
         total_units = (SELECT COUNT(*) FROM call_billing_units WHERE call_id = $1),
         total_points = (
           SELECT COALESCE(SUM(charged_points), 0)
           FROM call_billing_units WHERE call_id = $1
         ),
         updated_at = NOW()
     WHERE id = $1`,
    [callId],
  );

  // ★ otomo_status の復帰
  await db.query(
    `UPDATE otomo_status
     SET status='online'
     WHERE user_id=$1`,
    [call.otomo_id],
  );

  // ★ WS 通知
  wsManager.sendTo(
    call.user_id,
    JSON.stringify({
      type: "call_end",
      callId,
      reason: "forced_debug_end",
    }),
  );
  wsManager.sendTo(
    call.otomo_id,
    JSON.stringify({
      type: "call_end",
      callId,
      reason: "forced_debug_end",
    }),
  );

  return reply.send({
    status: "success",
    callId,
    ended: true,
  });
});
```

---

# 8. 注意点（非常に重要）

### 本番環境では絶対に使わせない

- 課金処理をスキップできてしまう危険
- 故意に使われるとサービス破壊につながる

### 利用権限

- admin ロールのみに制限
- もしくは NODE_ENV !== 'production' のときのみ有効

---

# 9. なぜ CALL-04 が必要なのか？

- WebRTC / TURN の通話中断は開発中に非常に多い
- バックエンドの状態が「通話中」から戻らない事故が起こりがち
- フロント未実装の段階でバックエンドだけテストできる
- billing_units を確認するのに便利
- Otomo の online/busy 状態を強制修復できる

開発効率が数倍上がる “デバッガー API” です。

---

# まとめ

CALL-04 は **開発効率を劇的に上げるための強制終了 API**。

- calls の終了処理を強制実行
- billing_units 集計
- otomo_status を online に復帰
- WS-S07(call_end) を送信
- 開発環境専用
- 誤用防止のため本番では必ず無効化

という、強力かつ正しく制御すべき API です。
