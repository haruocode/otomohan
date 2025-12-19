# RTC-06：POST /rtc/consumers/{id}/resume（Consumer の再生開始）

これは **SFU（mediasoup）で通話音声を相手に聞こえる状態にするために必須の API** です。

---

# ■ 目的

mediasoup の仕様では、Consumer は **作成直後は paused（受信停止）状態** です。

理由：

- クライアント側の consume() がまだ準備できていない
- 安全に同期するため

そのため、Consumer 作成後に、**SFU側で Consumer.resume() を実行してあげる必要があります。**これを行うのが本APIです。

---

# ■ エンドポイント仕様

### Method

```
POST /rtc/consumers/{consumerId}/resume
```

### 認証

```
Authorization: Bearer <token>
```

---

# ■ リクエストボディ

なし

（consumerId のみで十分）

---

# ■ レスポンス（成功時）

### 200 OK

```json
{
  "resumed": true
}
```

---

# ■ エラーレスポンス

### 404 Not Found（Consumer が見つからない）

```json
{
  "error": "CONSUMER_NOT_FOUND",
  "message": "指定された Consumer が存在しません。"
}
```

### 409 Conflict（すでに resume 済み）

```json
{
  "error": "ALREADY_RESUMED",
  "message": "Consumer はすでに受信を開始しています。"
}
```

---

# ■ サーバー（Fastify + mediasoup）実装例

```tsx
fastify.post("/rtc/consumers/:consumerId/resume", async (request, reply) => {
  const { userId } = request.user;
  const { consumerId } = request.params;

  const room = fastify.roomManager.getRoomByUserId(userId);
  if (!room) {
    return reply.status(404).send({
      error: "ROOM_NOT_FOUND",
      message: "Roomが見つかりません。"
    });
  }

  const consumer = room.getConsumerById(consumerId);
  if (!consumer) {
    return reply.status(404).send({
      error: "CONSUMER_NOT_FOUND",
      message: "指定された Consumer は存在しません。"
    });
  }

  if (!consumer.paused) {
    return reply.status(409).send({
      error: "ALREADY_RESUMED",
      message: "Consumer はすでに resume 済みです。"
    });
  }

  await consumer.resume();

  return reply.send({ resumed: true });
});
```

---

# ■ クライアント側（mediasoup-client）での流れ

### 1. Consumer を作成（RTC-05）

```tsx
const consumer = await recvTransport.consume({
  id: serverResponse.consumerId,
  kind: "audio",
  rtpParameters: serverResponse.rtpParameters
});
```

ここではまだ pause 状態。

### 2. resume API を呼ぶ

```tsx
await fetch(`/rtc/consumers/${consumer.id}/resume`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` }
});
```

### 3. 再生開始

```tsx
const track = consumer.track;
const audio = new Audio();
audio.srcObject = new MediaStream([track]);
audio.play();
```

---

# ■ Producer / Consumer / resume の関係（重要）

SFU経由で通話を成立させるには：

| 役割 | 必須処理 |
| --- | --- |
| **送信者（話す側）** | Producer を作る（RTC-04） |
| **受信者（聞く側）** | Consumer を作る（RTC-05） |
| **受信者（最終ステップ）** | Consumer.resume（RTC-06） |

resume を忘れると、相手の音声は**無音のまま**です。

---

# ■ この API の重要性（P2Pとの根本的な違い）

| 項目 | P2P | SFU（mediasoup） |
| --- | --- | --- |
| 音声受信の開始 | track が入ったらすぐ聞こえる | **Consumer を resume しなければ聞こえない** |
| 再生制御 | PeerConnection 内部で自動 | **サーバー側 API で制御できる** |
| 監視性 | 低い | **Consumer.resume した時点で「音声の受信開始」が確実にわかる** |

運営側が「どの時点で音声が流れたか」を判定できるため課金処理や不正対策にも強くなります。

---

# ■ RTC API 一覧（ここまでの進捗）

| API | 説明 |
| --- | --- |
| **RTC-01** | GET /rtc/capabilities |
| **RTC-02** | POST /rtc/transports |
| **RTC-03** | POST /rtc/transports/{id}/connect |
| **RTC-04** | POST /rtc/producers |
| **RTC-05** | POST /rtc/consumers |
| **RTC-06** | POST /rtc/consumers/{id}/resume |

これで **SFUを使用した音声通話が片方向・双方向で完成する最小セット** です。