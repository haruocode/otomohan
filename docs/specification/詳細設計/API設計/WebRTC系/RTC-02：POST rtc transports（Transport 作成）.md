# RTC-02：POST /rtc/transports（Transport 作成）

これは SFU（mediasoup）を使った WebRTC 通話で **最も重要な API の 1 つ** で、クライアントが「音声データの送受信用の WebRTC Transport」を生成するために呼びます。

---

# ■ 目的

mediasoup-client は、音声を送ったり受け取ったりするために

- **sendTransport（送信専用）**
- **recvTransport（受信専用）**

の 2 種類の Transport が必要。

クライアントは、この API を呼んでサーバー側に Transport を作成してもらい、

- ICE parameters
- ICE candidates
- DTLS parameters
- Transport ID

を受け取り、次のステップ（RTC-03 connect-transport）に進む。

---

# ■ エンドポイント仕様

### Method

```
POST /rtc/transports
```

### 認証

必須（通話中だけ使えるようにする）

```
Authorization: Bearer <token>
```

---

# ■ リクエストボディ

```json
{
  "callId": "call_abc123",
  "direction": "send"
}
```

| パラメータ  | 型                   | 説明                                       |
| ----------- | -------------------- | ------------------------------------------ |
| `callId`    | string               | 通話を識別する ID                          |
| `direction` | `"send"` or `"recv"` | 送信用 / 受信用 Transport のどちらを作るか |

---

# ■ レスポンス（成功時）

### Status: **201 Created**

```json
{
  "transportId": "ba61c18d-12b2-4f7c-a588-95549ce0fd06",
  "iceParameters": {
    "usernameFragment": "...",
    "password": "...",
    "iceLite": true
  },
  "iceCandidates": [
    {
      "foundation": "...",
      "priority": 123456,
      "ip": "11.22.33.44",
      "protocol": "udp",
      "port": 3478,
      "type": "host"
    }
  ],
  "dtlsParameters": {
    "role": "auto",
    "fingerprints": [
      {
        "algorithm": "sha-256",
        "value": "A1:B2:C3:..."
      }
    ]
  }
}
```

---

# ■ レスポンス項目説明

| フィールド       | 説明                                                        |
| ---------------- | ----------------------------------------------------------- |
| `transportId`    | サーバーで生成された mediasoup Transport の ID              |
| `iceParameters`  | ICE 接続のためのパラメータ                                  |
| `iceCandidates`  | SFU の ICE candidate（クライアントは addIceCandidate する） |
| `dtlsParameters` | DTLS ハンドシェイク情報                                     |

これらを受け取ったクライアントは、

次のステップで **transport.connect(dtlsParameters)** を呼びます。

---

# ■ クライアント側（mediasoup-client）での利用例

```tsx
const res = await fetch("/rtc/transports", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    callId,
    direction: "send",
  }),
});

const data = await res.json();

const sendTransport = device.createSendTransport({
  id: data.transportId,
  iceParameters: data.iceParameters,
  iceCandidates: data.iceCandidates,
  dtlsParameters: data.dtlsParameters,
});

// この後 RTC-03 で transport.connect() を呼ぶ
```

---

# ■ Fastify + mediasoup の実装例（サーバー）

mediasoup の典型的な Transport 作成コードを基にしています。

```tsx
fastify.post("/rtc/transports", async (request, reply) => {
  const { userId } = request.user;
  const { callId, direction } = request.body;

  const room = fastify.roomManager.get(callId);
  if (!room) {
    return reply.status(404).send({
      error: "ROOM_NOT_FOUND",
      message: "指定された callId の通話は存在しません。",
    });
  }

  const router = room.router;

  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: "0.0.0.0", announcedIp: process.env.PUBLIC_IP }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 600000,
  });

  // どのユーザーに紐づく Transport か保存しておく
  room.addTransport(userId, direction, transport);

  return reply.status(201).send({
    transportId: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  });
});
```

---

# ■ セキュリティ面

- 1 ユーザーが複数の Transport を無限に作らないように制限する
  → room.addTransport() 内でチェック
- callId 単位で権限を確認する
  → その callId の当事者のみ許可
- listenIps は NAT / Reverse proxy に合わせて設定する必要あり

---

# ■ フロー全体（送信用 Transport の場合）

1. クライアント

   → **RTC-01 /rtc/capabilities** で Router 能力を読み込む

2. クライアント

   → **RTC-02 /rtc/transports（direction: "send"）** を呼ぶ

3. サーバー

   → sendTransport 生成、パラメータを返す

4. クライアント

   → device.createSendTransport() で初期化

5. クライアント

   → sendTransport.connect() すると、RTC-03 が必要

---

# ■ 次に必要な API

Transport を作成したら、

次は **RTC-03：POST /rtc/transports/{id}/connect**

（DTLS パラメータをサーバーへ送信して Transport を接続するやつ）

が必要です。

続けて作成しますか？
