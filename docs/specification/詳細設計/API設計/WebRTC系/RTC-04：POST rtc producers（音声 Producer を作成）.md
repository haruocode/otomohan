# RTC-04：POST /rtc/producers（音声 Producer を作成）

これは **ユーザーまたはおともはんの「音声送信開始」** を SFU（mediasoup）側に登録するための API です。Transport は「通る道」。Producer は「送る音声ストリーム」。

つまり：

> RTC-02：Transport 作成
>
> → **RTC-03：DTLS 接続**
>
> → **RTC-04：Producer 作成（音声送信開始）**

という流れ。

---

# ■ 目的

ユーザー（またはおともはん）は、自分の音声（Opus RTP）を SFU に送信するために **Audio Producer** を作成する必要があります。Producer を作ると、SFU 上に

- **user から SFU へ送られる音声ストリーム**

が登録され、相手側クライアントがこれを **RTC-05 consume** で受信できるようになります。

---

# ■ エンドポイント仕様

### Method

```
POST /rtc/producers
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
  "transportId": "69b2d3a1-3b88-4c5e-b4f8-073e8019c18e",
  "kind": "audio",
  "rtpParameters": {
    "codecs": [...],
    "encodings": [...],
    "headerExtensions": [...],
    "rtcp": { ... }
  }
}
```

### 各フィールド説明

| フィールド      | 型                               | 説明                                                      |
| --------------- | -------------------------------- | --------------------------------------------------------- |
| `callId`        | string                           | 通話の ID                                                 |
| `transportId`   | string                           | 自分の sendTransport の ID                                |
| `kind`          | `"audio"`（将来 `"video"` も可） | 今回は音声のみ                                            |
| `rtpParameters` | object                           | クライアント側が `sendTransport.produce()` の前に生成する |

---

# ■ レスポンス（成功時）

### 201 Created

```json
{
  "producerId": "d31a3fb3-5b6c-4f36-a8c6-3c8bbfe8d9e6"
}
```

---

# ■ 実装例（Fastify + mediasoup）

```tsx
fastify.post("/rtc/producers", async (request, reply) => {
  const { userId } = request.user;
  const { callId, transportId, kind, rtpParameters } = request.body;

  const room = fastify.roomManager.get(callId);
  if (!room) {
    return reply.status(404).send({
      error: "ROOM_NOT_FOUND",
      message: "Roomが見つかりません。",
    });
  }

  const transport = room.getTransportById(transportId);
  if (!transport) {
    return reply.status(404).send({
      error: "TRANSPORT_NOT_FOUND",
      message: "送信用Transportが存在しません。",
    });
  }

  // Producer 作成
  const producer = await transport.produce({
    kind,
    rtpParameters,
  });

  // Room に記録
  room.addProducer(userId, producer);

  return reply.status(201).send({
    producerId: producer.id,
  });
});
```

---

# ■ クライアント側（mediasoup-client）での使い方

```tsx
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const track = stream.getAudioTracks()[0];

const producer = await sendTransport.produce({
  track,
  codecOptions: {
    opusStereo: 0,
    opusDtx: 1,
  },
});

// ここで rtpParameters を取り出す必要がある
const rtpParameters = producer.rtpParameters;

await fetch("/rtc/producers", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    callId,
    transportId: sendTransport.id,
    kind: "audio",
    rtpParameters,
  }),
});
```

※ **注意**

本来、クライアントの `produce()` ではサーバーに callback を返す形式が一般的（WebSocket）ですが、ここでは REST API 版を維持するためにこの形式で記述しています。

---

# ■ Producer 作成後にできること

相手側（おともはん or ユーザー）が

**RTC-05 /rtc/consumers** を呼ぶことで

- 自分の producer を相手が受信できるようになる。

また、SFU 側では、

- RTP が到達した瞬間に「接続確立」と判定可能
  → `WS-S04 call_connected` の発火ポイントになる
  → 課金タイマースタートもここで可能

---

# ■ この API の役割（P2P との差分）

| 項目                 | P2P                                    | SFU                                           |
| -------------------- | -------------------------------------- | --------------------------------------------- |
| 音声送信開始         | PeerConnection に track を追加するだけ | **サーバーに Producer を作成する必要がある**  |
| 相手が受信する仕組み | PeerConnection の negotiation          | **SFU が Producer/Consumer を仲介**           |
| 運営者監視           | 不可能                                 | **SFU が RTP を受信するため完全に把握できる** |

---

# ■ まとめ

- Producer ＝「話者の音声ストリーム」そのもの
- これを作成しないと相手は音声を受け取れない
- SFU なので、サーバーが「音声が流れているか」を確実に監視可能
- 課金開始の安全性が大幅に上がる
