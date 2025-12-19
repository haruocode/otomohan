# WS-S04：call_connected（RTP到達ベースの通話開始通知）

これは **P2P版の「自己申告による接続完了」** を捨てて、**SFU（mediasoup）が RTP パケットの到達を検知した瞬間を “正しい通話開始” とする**という、商用通話サービスに必須の安全な方式です。

---

# 🎯 目的（SFU版 call_connected の本質）

- 通話が「本当に」開始された瞬間だけを通知する
- **P2Pの“自己申告”ではなく、運営サーバーが確実に把握する**
- ここから **毎分課金のタイマーをスタート** できる
- 不正対策（ユーザー側の偽装）を完全に防げる
- 録音・ログ管理・通話解析の基点としても利用できる

---

# SFU版 WS-S04 call_connected のイベント仕様

---

# ■ 送信方向

```
Server → User
Server → Otomo
```

両当事者に送信されます。

---

# ■ メッセージ構造（JSON）

```json
{
  "type": "call_connected",
  "payload": {
    "callId": "call_abc123",
    "userId": "user_001",
    "otomoId": "otomo_777",
    "connectedAt": "2025-01-15T12:02:15.123Z",
    "method": "sfu_rtp_detected"
  }
}
```

---

# ■ フィールド説明

| フィールド | 説明 |
| --- | --- |
| `callId` | 通話ID |
| `userId` | 一方のID |
| `otomoId` | もう一方のID |
| `connectedAt` | SFU が「音声RTPが届いた」と判定した時刻 |
| `method` | `"sfu_rtp_detected"` 固定（SFU版であることが明確になる） |

---

# ■ 発火条件（SFUによる確定ロジック）

SFUで Producer が active になり、**最初の RTP パケットを受信した瞬間** に発火。

流れは以下の通り：

### 1. 送信者側

- Producer（音声）が RTC-04 で作成される
- RTP パケットが SFU に流れてくる

### 2. SFU（mediasoup）側

- “producer.on('trace')” または
- “producer.on('score')” または
- “transport.on('rtcp')”
    
    で RTP の到達を検知できる
    

### 3. SFU が内部的に以下を行う

- その callId の状態を “connected” に更新
- connectedAt を記録
- RTPが死ぬまでは「通話中」として扱える

### 4. WebSocket で call_connected を両者に送信

（※ユーザー側の自己申告は不要・禁止）

---

# ■ サーバー実装例（mediasoup + WebSocket）

```tsx
producer.on("trace", trace => {
  if (trace.type === "rtp") {
    const now = new Date().toISOString();

    // Room 状態を更新
    room.setConnected(now);

    // WebSocket で当事者に通知
    const msg = JSON.stringify({
      type: "call_connected",
      payload: {
        callId: room.callId,
        userId: room.userId,
        otomoId: room.otomoId,
        connectedAt: now,
        method: "sfu_rtp_detected"
      }
    });

    wsServer.sendTo(room.userId, msg);
    wsServer.sendTo(room.otomoId, msg);
  }
});
```

---

# 🚀 **ここが最大の重要ポイント**

## P2P時の欠点

- クライアントが「接続しました」と言うだけ
- 実際に音声が流れているかは不明
- 不正（偽装）が可能
- 毎分課金の開始点として信用できない
- 運営側が状態を把握できない
- 録音やログとの整合が取れない

## SFU時のメリット

- **音声の “実際の流れ” を SFU が直接検知できる**
- 通話開始の通知が100%正確
- 課金の開始が完全に安全
- 不正対策に極めて強い
- 監査ログ・録音などと完全同期
- 問題調査が容易
- 片側だけ切れても SFU が検知できる

---

# ■ クライアントはどう使う？

受信側：

```tsx
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "call_connected") {
    startCallTimer();
    showActiveCallUI();
    enableCallButtons();
  }
};
```

※ P2P版と違い、クライアントは何も送信しない

（“webrtc_connected” の自己申告は廃止）

---

# ■ SFU版 call_connected のフロー（全体）

以下は SFU版の正しい流れ：

1. call_request（WS）
2. incoming_call（WS）
3. call_accept（WS）
4. call_accepted（WS）
5. **RTC-01～06（Producer/Consumer作成）**
6. SFUが最初のRTPを受信
7. **WS-S04 call_connected を SFU が自動送信 ← ここがP2Pと違う**
8. 課金タイマー開始（サーバー）
9. WS-S05 tick（毎分通知）

---

# ■ この方式は商用サービスで標準

LINE

Discord

Zoom

Whereby

音声通話アプリ全般

ライブ配信SFU系サービス

すべて **“RTP到達” を通話開始の確定ポイントとしている。**

理由は：

- 法的に通話開始ログが必要
- 不正防止
- 録音との同期
- 双方で通話開始の瞬間を一致させる必要がある
- クライアント側の嘘を排除できる

---

# ■ まとめ

| 項目 | P2P版 | SFU版 |
| --- | --- | --- |
| 接続確立方法 | クライアント自己申告 | **SFUがRTPパケット到達を検知** |
| 信頼性 | 低い | **最高に高い（100%確実）** |
| 課金開始 | 危険（誤課金の可能性） | **安全（100%正しい開始点）** |
| 監視性 | 不可能 | **通話状態を運営側が完全把握可能** |