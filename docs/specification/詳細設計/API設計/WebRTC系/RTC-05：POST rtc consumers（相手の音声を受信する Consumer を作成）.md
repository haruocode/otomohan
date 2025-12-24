# RTC-05：POST /rtc/consumers（相手の音声を受信する Consumer を作成）

これは **SFU（mediasoup）で必須になる「相手の音声ストリームを受信準備する API」** です。

---

# ■ 目的

通話では、双方が次の 2 つを行う必要があります：

1. 自分の音声 → SFU へ送る（Producer）
2. 相手の音声 ← SFU から受け取る（Consumer）

この API は **② 相手の音声を受信するための Consumer をサーバー側に作成** するものです。

SFU では：

- 音声 = Producer（送信者側）
- Consumer = Producer を購読するための受信器（受信者側）

Producer を作っただけでは相手は聞こえません。Consumer 作成が必要です。

---

# ■ エンドポイント仕様

### Method

```
POST /rtc/consumers
```

### 認証

必須：

```
Authorization: Bearer <token>
```

---

# ■ リクエストボディ

```json
{
  "callId": "call_abc123",
  "transportId": "8b1a22ad-7b26-4de5-87d2-10fb2bb42bdf",
  "producerId": "d31a3fb3-5b6c-4f36-a8c6-3c8bbfe8d9e6"
}
```

| フィールド    | 説明                         |
| ------------- | ---------------------------- |
| `callId`      | この通話の ID                |
| `transportId` | 受信用の recvTransport の ID |
| `producerId`  | 相手側の Producer の ID      |

---

# ■ レスポンス（成功時）

### Status: 201 Created

```json
{
  "consumerId": "9e8d2af1-4c33-41d8-a7f2-7e0cded0fb54",
  "kind": "audio",
  "rtpParameters": {
    "codecs": [...],
    "encodings": [...],
    "headerExtensions": [...]
  },
  "producerPaused": false
}
```

### 各フィールド説明

| フィールド       | 説明                                                          |
| ---------------- | ------------------------------------------------------------- |
| `consumerId`     | サーバーで生成された Consumer ID                              |
| `kind`           | "audio"（今回は音声のみ）                                     |
| `rtpParameters`  | **クライアントが consume() するために必要なパラメータ**       |
| `producerPaused` | Producer が一時停止しているか（今回の音声通話では常に false） |

---

# ■ サーバー実装（Fastify + mediasoup）

```tsx
fastify.post("/rtc/consumers", async (request, reply) => {
  const { userId } = request.user;
  const { callId, transportId, producerId } = request.body;

  const room = fastify.roomManager.get(callId);
  if (!room) {
    return reply.status(404).send({
      error: "ROOM_NOT_FOUND",
      message: "Roomが存在しません。",
    });
  }

  const transport = room.getTransportById(transportId);
  if (!transport) {
    return reply.status(404).send({
      error: "TRANSPORT_NOT_FOUND",
      message: "recvTransport が存在しません。",
    });
  }

  const producer = room.getProducerById(producerId);
  if (!producer) {
    return reply.status(404).send({
      error: "PRODUCER_NOT_FOUND",
      message: "相手の Producer が存在しません。",
    });
  }

  // mediasoupのConsumer作成
  const consumer = await transport.consume({
    producerId: producer.id,
    rtpCapabilities: room.router.rtpCapabilities,
  });

  // Room に保持
  room.addConsumer(userId, consumer);

  return reply.status(201).send({
    consumerId: consumer.id,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
    producerPaused: consumer.producerPaused,
  });
});
```

---

# ■ クライアント側（mediasoup-client）での利用例

recvTransport を作った後に呼びます。

```tsx
const res = await fetch("/rtc/consumers", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    callId,
    transportId: recvTransport.id,
    producerId: remoteProducerId,
  }),
});

const data = await res.json();

const consumer = await recvTransport.consume({
  id: data.consumerId,
  kind: data.kind,
  rtpParameters: data.rtpParameters,
});

// メディア再生
const { track } = consumer;
const audio = document.createElement("audio");
audio.srcObject = new MediaStream([track]);
audio.play();
```

---

# ■ SFU で Consumer 作成の流れ（フロー）

1. 相手の Producer が作成済み
2. 自分の recvTransport を作る
3. この API **/rtc/consumers** を呼ぶ
4. サーバー側で Consumer オブジェクト生成
5. rtpParameters をクライアントへ返す
6. クライアント側で

   `recvTransport.consume({ consumerId, rtpParameters })`

7. 再生可能になる（audio.play）

---

# ■ P2P との違い（差分）

| 項目             | P2P                                 | SFU（mediasoup）                          |
| ---------------- | ----------------------------------- | ----------------------------------------- |
| 相手音声の受信   | PeerConnection が勝手に negotiation | **Consumer を明示的に作成する必要がある** |
| 音声ルーティング | peer → peer                         | peer → SFU → peer                         |
| 通話状態の監視   | サーバーは知らない                  | **SFU が全ストリームを把握できる**        |
| 録音・監査       | 不可能                              | **Server-Side 録音が可能**                |
