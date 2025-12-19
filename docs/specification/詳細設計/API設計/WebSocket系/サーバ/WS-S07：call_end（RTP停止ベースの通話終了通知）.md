# WS-S07：call_end（RTP停止ベースの通話終了通知）

P2P版のように「クライアントが勝手に `call_end` を送る」のではなく、**SFU が RTP トラフィック停止を検知した時点を“公式の通話終了”とする** 方式。

---

# なぜ SFU版 call_end が必要なのか？

理由は3つ：

1. **ユーザー側で「勝手に切断」されてもサーバーが確実に検知できる**
2. **異常切断（アプリ落ち・ネット断・電池切れ）でも課金が正確に止まる**
3. **サーバーが必ず通話終了処理（DB保存・課金締め・cleanup）を実行できる**

P2Pではどれも不可能だった。

---

# 🧠 **SFUによる RTP 停止検知とは？**

mediasoup の Producer（音声送信者）は、数秒間（例：5〜8秒）RTPが流れなくなると「実質切断」とみなせます。

検知方法：

- producer.on('score') の変化
- producer.on('trace') のRTPイベント消失
- consumer.on('layerschange')
- transport.on('icestatechange', 'connectionstatechange')

特に **RTP trace の途絶が最も正確**。

### 例：RTP が 10 秒以上来ない → call_end 発火

---

# 🧩 **SFU版 call_end のトリガー条件（厳密版）**

次のいずれかを満たすと通話終了とする：

1. **誰かの Producer が一定時間（例：10秒）RTPを送らない**
2. **Transport が disconnected → failed**
3. **User または Otomo の WS が切断された（サーバー側）**
4. **課金処理で残高不足 → billingService が“end”フラグを返した**

どれが理由でも call_end を同じフォーマットで飛ばす。

---

# **WS-S07 call_end（SFU版）メッセージ仕様**

```json
{
  "type": "call_end",
  "payload": {
    "callId": "call_abc123",
    "userId": "user_001",
    "otomoId": "otomo_777",
    "endedAt": "2025-01-15T12:07:33.500Z",
    "reason": "rtp_stopped",
    "durationSeconds": 233,
    "totalChargedPoints": 480
  }
}
```

---

# フィールド説明

| フィールド | 説明 |
| --- | --- |
| `callId` | 通話ID |
| `endedAt` | SFU（サーバー）が通話終了と確定した時刻 |
| `reason` | `"rtp_stopped" / "disconnect" / "low_balance" / "manual"` |
| `durationSeconds` | SFUが記録した通話継続時間 |
| `totalChargedPoints` | call_tick の累計課金ポイント |

---

# 🎬 **サーバー側の処理フロー（擬似コード）**

```tsx
producer.on("trace", async trace => {
  if (trace.type === "rtp") {
    room.updateLastRtpAt();
  }
});

// 別スレッドで RTP 監視
setInterval(async () => {
  const now = Date.now();

  if (now - room.lastRtpAt > 10_000) { // 10秒RTPなし
    endCall("rtp_stopped");
  }
}, 2000);

async function endCall(reason) {
  if (room.state === "ended") return;

  room.state = "ended";

  const endedAt = new Date().toISOString();
  const duration = Math.floor((Date.now() - room.connectedAtMs) / 1000);

  const totalChargedPoints = await billingService.closeCall(room.callId);

  // --- WS通知（ユーザー／おともはん） ----
  wsServer.sendTo(room.userId, {
    type: "call_end",
    payload: {
      callId: room.callId,
      userId: room.userId,
      otomoId: room.otomoId,
      endedAt,
      reason,
      durationSeconds: duration,
      totalChargedPoints
    }
  });

  wsServer.sendTo(room.otomoId, { ...同じpayload… });

  // --- SFUリソース破棄 ---
  room.cleanup(); // RTC-07

  // --- DB更新 ---
  db.call.update({
    where: { callId: room.callId },
    data: { status: "ended", endedAt, reason }
  });
}
```

---

# 🎯 **どの理由でも call_end は一元化**

| 状況 | reason |
| --- | --- |
| RTPが止まった | `"rtp_stopped"` |
| クライアントのWebSocket切断 | `"disconnect"` |
| 残高ゼロで強制終了 | `"low_balance"` |
| ユーザーが明示的に終了 | `"manual"` |

フロント側は reason に応じて表示を切り替えるだけでOK。

---

# 🎧 **クライアント側の受信例（共通処理）**

```tsx
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "call_end") {
    stopCallTimer();
    showCallSummary(msg.payload);
    navigateToCallEndScreen(msg.payload);
  }
};
```

---

# 💡 通話終了を SFU とサーバーで管理するメリット

| 課題 | P2P版 | SFU版 |
| --- | --- | --- |
| アプリ落ちで終了通知が来ない | 起こる → 課金が続く | **SFUが検知 → 終了** |
| ネット断でユーザー消失 | 起こる | **SFUがRTP停止で検知** |
| 課金漏れ | 起こる | RTPベースなので極小 |
| 不正（通話中だけど終了偽装） | 可能 | **SFUで防げる** |
| 切断の正確なログ | 取れない | **正確な endedAt を記録可能** |

---

# まとめ（SFU版 call_end）

- **通話終了の主導権は完全にサーバー側（SFU）にある**
- クライアント側から終了イベントを送らせない
    
    → 不正防止 & 安全な課金
    
- RTP停止や異常切断も検知できる
- `call_tick` と完全同期し、課金の整合性が100%取れる
- すべてのケースで一本化された call_end イベントを通知