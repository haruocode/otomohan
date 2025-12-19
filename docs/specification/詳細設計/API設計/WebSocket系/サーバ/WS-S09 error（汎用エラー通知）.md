# WS-S09 error（汎用エラー通知）

了解しました。

ここでは **WS-S09「error」（汎用エラー通知）」** の詳細設計をまとめます。

このイベントは WebSocket 通信における **統一されたエラー通知フォーマット** を提供するためのもので、

サーバ側から「異常が発生した」「リクエストを処理できない」などを

**クライアントへ即時通知するための共通イベント** です。

REST API の HTTP ステータスとは異なり、

WebSocket では **イベントごとのエラーを明確に返す必要がある**ため

非常に重要な仕組みとなります。

---

# 1. イベント概要

| 項目 | 内容 |
| --- | --- |
| ID | **WS-S09** |
| type | `error` |
| direction | **Server → Client（User or Otomo）** |
| 用途 | クライアントの WebSocket リクエストに対するエラーを返す共通ハンドラ |

---

# 2. JSON 形式（基本形）

```json
{
  "type": "error",
  "code": "INVALID_CALL_STATE",
  "message": "This action is not allowed in the current call state.",
  "context": {
    "callId": "d4e8f139-5212-4e2e-8c30-aaaabbbbcccc"
  },
  "timestamp": 1706605800
}
```

---

# 3. フィールド仕様

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| type | string | ○ | `"error"` 固定 |
| code | string | ○ | エラーコード（ロジック判別用） |
| message | string | ○ | 人間向けの簡易説明（翻訳 UI で変更可能） |
| context | object/null | 任意 | 追加情報（callId 等） |
| timestamp | number | ○ | UNIX秒 |

---

# 4. 代表的なエラーコード一覧（標準化）

### 認証系

| code | 説明 |
| --- | --- |
| `UNAUTHORIZED` | JWT が無効・期限切れ |
| `FORBIDDEN` | 権限なし（User が Otomo API を実行等） |

---

### 通話状態系

| code | 説明 |
| --- | --- |
| `INVALID_CALL_ID` | callId が存在しない |
| `INVALID_CALL_STATE` | 現在の状態でその操作はできない |
| `CALL_ALREADY_ENDED` | 終了済みの通話に操作した |
| `CALL_NOT_PARTICIPANT` | call に関係ないユーザー |

---

### シグナリング系

| code | 説明 |
| --- | --- |
| `SIGNAL_REJECTED` | signal データが不正 |
| `PEER_UNAVAILABLE` | 相手側がオフライン |

---

### ポイント・決済関連

| code | 説明 |
| --- | --- |
| `INSUFFICIENT_POINTS` | 事前に残高不足が判明 |
| `BILLING_FAILED` | 課金処理が失敗 |

---

### システム系

| code | 説明 |
| --- | --- |
| `INTERNAL_ERROR` | サーバ内部エラー |
| `RATE_LIMITED` | 一定時間内にリクエストしすぎ |
| `BAD_REQUEST` | JSON フォーマットが不正 |

---

# 5. サーバ側の送信例（擬似コード）

```tsx
function sendWsError(ws, code, message, context = {}) {
  ws.send(JSON.stringify({
    type: "error",
    code,
    message,
    context,
    timestamp: Math.floor(Date.now() / 1000)
  }));
}
```

使用例：

```tsx
if (!call) {
  return sendWsError(ws, "INVALID_CALL_ID", "Call does not exist.", {
    callId: msg.callId
  });
}
```

---

# 6. 主に利用される場面

---

## ① call_request / call_accept / call_reject の異常

- callId が存在しない
- otomo が offline
- すでに通話中（busy）
- その状態では操作できない

---

## ② signal の不正

- SDP 不正
- ICE candidate が malformed
- 現在 connecting ではない

---

## ③ wallet（ポイント）関連

- 事前に不足がわかった場合
- 決済処理の異常

---

## ④ WebSocket の JSON が壊れている

- parse error
- type が不明

---

# 7. クライアント側（User / Otomo）の UI 反映

### U-04（通話中画面）

- 「接続できませんでした」
- 「相手の応答がありません」

### U-01（一覧）

- 操作失敗 → toast 表示

### O-02（着信）

- 今の状態では受けられない → エラー表示

---

# 8. 状態マシンとの関係

error は状態遷移を行わない。

ただし UI 制御上は以下へ戻る：

- U-03 → U-01（呼び出し失敗）
- O-02 → O-01（応答失敗）

---

# 9. エラーイベントの設計哲学

WebSocket でよくあるアンチパターンは：

- すべてのエラーを静かに無視する
- イベントごとに独自のエラーフォーマット
- エラーをクライアントに返さない

それを避けるため：

### 👍 WS-S09 = 全イベント共通の「統一されたエラー形式」

この統一により：

- クライアントコードが簡潔
- UI 通知が統一
- デバッグがしやすい

という大きなメリットが生まれます。

---

# 10. このイベントの重要性

WS-S09 は WebSocket プロトコル全体の品質を左右します。

- どのイベントにも適用できる汎用エラー
- エラーコードを標準化して運用しやすく
- UI 表示を安定させ、利用者体験を損なわない
- デバッグ効率・開発効率を大きく改善

これにより、リアルタイム通話サービスとしての信頼性が大幅に向上します。