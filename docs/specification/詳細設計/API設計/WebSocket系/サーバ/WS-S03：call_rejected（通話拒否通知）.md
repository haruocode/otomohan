# WS-S03：call_rejected（通話拒否通知）

おともはん側が通話リクエストを拒否した際にクライアントへ通知する WebSocket メッセージとして設計する。

---

## 目的

ユーザーが送った通話リクエストに対し、**おともはん側が「拒否」したことをユーザーへリアルタイム通知する**。そのための WebSocket イベント。

---

# 想定フロー（全体）

1. ユーザー → おともはんへ通話リクエスト （WS-C02）
2. おともはんが通知を受ける（WS-S02）
3. おともはんアプリが「拒否」を選択
    
    → サーバーへ `WS-C03 call_reject` を送信
    
4. サーバーがユーザーへ `WS-S03 call_rejected` を送信
5. フロント UI は通話リクエストモーダルを閉じ「拒否されました」表示

---

# 送信方向

```
Server → User
```

対象：

通話リクエストを送った **ユーザー側クライアント**

---

# メッセージ仕様（サーバー → クライアント）

### メッセージ形式（JSON）

```json
{
  "type": "call_rejected",
  "payload": {
    "callId": "call_abc123",
    "otomoId": "otomo_001",
    "reason": "busy",
    "timestamp": "2025-01-15T12:01:23Z"
  }
}
```

---

# フィールド説明

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `type` | string | 固定 `"call_rejected"` |
| `payload.callId` | string | 通話リクエストID |
| `payload.otomoId` | string | 拒否したおともはんのID |
| `payload.reason` | string | 拒否理由（任意） |
| `payload.timestamp` | string | サーバー側の処理時刻 |

---

# reason の例（任意）

| reason | 説明 |
| --- | --- |
| `"busy"` | 他の通話中 |
| `"manual_reject"` | おともはんが手動で拒否 |
| `"no_response"` | 一定時間応答なし |
| `"offline"` | おともはんがオフライン化 |

※フロント表示用に使用。

---

# サーバー内部処理（擬似コード）

```tsx
// おともはんが call_reject を送ってきた
ws.on("call_reject", async (data, otomoClient) => {
  const { callId } = data;

  // DBで callId → userId を取得
  const call = await db.call.findUnique({ where: { callId } });
  if (!call) return;

  // 相手（ユーザー）の WebSocket セッションを取得
  const userClient = sessionStore.get(call.userId);
  if (!userClient) return;

  // 通知を送信
  userClient.sendJSON({
    type: "call_rejected",
    payload: {
      callId,
      otomoId: call.otomoId,
      reason: data.reason || "manual_reject",
      timestamp: new Date().toISOString()
    }
  });

  // コール状態を更新
  await db.call.update({
    where: { callId },
    data: { status: "rejected" }
  });
});
```

---

# クライアント側（ユーザー）受信処理（例：TypeScript）

```tsx
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "call_rejected") {
    showToast("おともはんに拒否されました");
    closeCallRequestModal();
  }
};
```

---

# UI で期待される挙動

### ユーザー側（通話リクエストした側）

- ポップアップ「おともはんに拒否されました」
- 通話リクエスト画面を閉じる
- ボタンを再表示（再リクエスト可能状態）

### おともはん側

- 特に通知なし（拒否ボタンを押しただけ）

---

# 状態管理への反映（コール状態マシン）

`call_rejected` を受けたら、状態は以下へ遷移：

```
REQUESTING → REJECTED → IDLE
```