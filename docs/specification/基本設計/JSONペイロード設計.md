# JSONペイロード設計

チャッピーが提案してくれたので記録しておく。

以下コピペ。

**「おともはん」通話状態マシンに完全対応した WebSocket イベント仕様（JSONペイロード定義）」** をすべて設計します。

---

# 🔷 目的：WebSocket イベント仕様とは？

- **クライアント ⇄ サーバ間のリアルタイム通信の契約書**
- REST API では表現できない「通話の状態管理」を担当
- WebRTC シグナリング（offer/answer/candidate）
- 1分課金の tick イベント
- サーバ主導（authoritative）の状態遷移

---

# 🔷 全イベント一覧（完全版）

通話状態マシンに沿って、必要なイベントをすべて網羅すると：

### ▼ クライアント → サーバ（C→S）

```
init_connection
call_request
call_cancel
call_accept
call_reject
webrtc_offer
webrtc_answer
ice_candidate
call_connected
call_end_request
heartbeat
```

---

### ▼ サーバ → クライアント（S→C）

```
connection_ack
incoming_call
call_ringing
call_accepted
call_rejected
signaling_start
webrtc_offer
webrtc_answer
ice_candidate
call_state_update
call_tick      ← 課金イベント
call_force_end
call_end
error
heartbeat_ack
```

かなり多いですが、

**これだけ定義しておけばスケール・再接続・例外に強いアーキテクチャになります。**

---

# 🔷 JSON Payload の仕様（完全版）

ここから1つずつ、**「構造」「使用タイミング」「サーバ動作」** を明確化します。

---

# 🔵【C→S】init_connection（接続初期化）

```json
{
  "type": "init_connection",
  "userId": "uuid",
  "token": "jwt-or-session-token"
}
```

**使用タイミング**

- WebSocket 接続直後に送る
- userId と token の正当性チェック

---

# 🔵【S→C】connection_ack（初期化成功）

```json
{
  "type": "connection_ack",
  "userId": "uuid",
  "connectedAt": 1700000000
}
```

---

# 🔵【C→S】call_request（ユーザー → おともはんへ発信）

```json
{
  "type": "call_request",
  "toUserId": "otomo-uuid",
  "callId": "uuid"
}
```

**サーバ動作**

- call テーブルにレコード作成（status = ringing）
- おともはんへ `incoming_call` を送信

---

# 🔵【S→C】incoming_call（着信通知）

```json
{
  "type": "incoming_call",
  "fromUserId": "user-uuid",
  "callId": "uuid"
}
```

---

# 🔵【C→S】call_accept（おともはんが応答）

```json
{
  "type": "call_accept",
  "callId": "uuid"
}
```

サーバ：

- calls.status = accepted
- 両者へ `call_accepted` を送信

---

# 🔵【S→C】call_accepted（応答済み通知）

```json
{
  "type": "call_accepted",
  "callId": "uuid"
}
```

---

# 🔵【C→S】call_reject

```json
{
  "type": "call_reject",
  "callId": "uuid",
  "reason": "busy"
}
```

サーバ：

- calls.status = failed
- ユーザーへ通知

---

# 🔵【S→C】call_rejected

```json
{
  "type": "call_rejected",
  "callId": "uuid",
  "reason": "busy"
}
```

---

# 🔵【S→C】signaling_start（シグナリング開始指示）

```json
{
  "type": "signaling_start",
  "callId": "uuid"
}
```

サーバ → 両方

- WebRTC の offer/answer のやりとりを開始せよ

---

# 🔵【C→S】webrtc_offer

```json
{
  "type": "webrtc_offer",
  "callId": "uuid",
  "offer": { "sdp": "...", "type": "offer" }
}
```

---

# 🔵【S→C】webrtc_offer（おともはん側へ）

```json
{
  "type": "webrtc_offer",
  "callId": "uuid",
  "fromUserId": "uuid",
  "offer": { ... }
}
```

---

# 🔵【C→S】webrtc_answer

```json
{
  "type": "webrtc_answer",
  "callId": "uuid",
  "answer": { "sdp": "...", "type": "answer" }
}
```

---

# 🔵【S→C】webrtc_answer

```json
{
  "type": "webrtc_answer",
  "callId": "uuid",
  "fromUserId": "uuid",
  "answer": { ... }
}
```

---

# 🔵【C→S】ice_candidate

```json
{
  "type": "ice_candidate",
  "callId": "uuid",
  "candidate": {
    "candidate": "...",
    "sdpMid": "audio",
    "sdpMLineIndex": 0
  }
}
```

---

# 🔵【S→C】ice_candidate

同じ形式で相手へ転送。

---

# 🔵【C→S】call_connected（WebRTC 接続確立）

```json
{
  "type": "call_connected",
  "callId": "uuid"
}
```

**サーバ動作（超重要）**

- calls.status = in_call
- calls.started_at = NOW()
- 1分課金タイマーを開始
- 両者へ `call_state_update`(in_call) を送信

---

# 🔵【S→C】call_state_update（状態が変わった）

```json
{
  "type": "call_state_update",
  "callId": "uuid",
  "state": "in_call",
  "timestamp": 1700000000
}
```

---

# 🔵【S→C】call_tick（1分ごとの課金完了通知）

```json
{
  "type": "call_tick",
  "callId": "uuid",
  "unitIndex": 2,
  "charged": 100,
  "balance": 400,
  "nextBillingAt": 1700003600
}
```

**サーバの authoritative timer によってのみ送信する。**

ここで UI のカウントダウンが進む。

---

# 🔵【S→C】call_force_end（ポイント不足など強制終了）

```json
{
  "type": "call_force_end",
  "callId": "uuid",
  "reason": "no_point"
}
```

---

# 🔵【C→S】call_end_request（ユーザーが終了ボタンを押した）

```json
{
  "type": "call_end_request",
  "callId": "uuid"
}
```

---

# 🔵【S→C】call_end（通話終了）

```json
{
  "type": "call_end",
  "callId": "uuid",
  "reason": "user_end",
  "totalSeconds": 180
}
```

DB 反映後に送信。

---

# 🔵【C→S】heartbeat / 【S→C】heartbeat_ack

Keepalive（WebSocket が落ちたら network_lost 扱い）

---

# 🔵【S→C】error

```json
{
  "type": "error",
  "code": "INVALID_STATE",
  "message": "Cannot accept a call that is not ringing"
}
```

---

# 🔷 サーバ側が authoritative（権威）であるためのルール

1. **サーバが状態マシンを持つ（クライアントは状態を持たない）**
2. 状態遷移はサーバが決定する
3. 課金はサーバタイマーのみが実行
4. call_connected を受け取った瞬間に状態を in_call に
5. call_end はサーバが最終判断する
6. 予期しないイベントは error を返す

---

# 🔷 フロントエンドはどう実装する？

すべてのイベントは

```tsx
ws.onmessage = (msg) => {
  switch(msg.type) {
    case "call_state_update": // 状態に合わせてUI更新
    case "call_tick":         // カウントダウン更新
    case "incoming_call":     // 着信画面表示
    ...
  }
}
```

という形で処理可能。