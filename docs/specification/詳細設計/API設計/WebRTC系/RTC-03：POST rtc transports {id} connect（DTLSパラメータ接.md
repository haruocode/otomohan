# RTC-03：POST /rtc/transports/{id}/connect（DTLS パラメータ接続）

これは mediasoup の WebRtcTransport を “本当に使える状態” にするための**DTLS ハンドシェイク確立 API** です。Transport を作っただけでは音声は流れません。この API を呼び、クライアントの DTLS パラメータを SFU に渡すことで、初めて Audio Producer / Consumer を作れるようになります。

---

# ■ 目的

RTC-02 で作成された Transport には以下の状態がある：

- ICE Parameters（サーバー側）
- ICE Candidates（サーバー側）
- DTLS Parameters（サーバー側）

これに対し、クライアント側（mediasoup-client）は`transport.connect({ dtlsParameters })` を実行すると：

- **クライアントが生成した DTLS パラメータをサーバーへ送る**

必要があります。

この API はその DTLS パラメータを受け取り、サーバー側の Transport に適用し、DTLS ハンドシェイクを完了させます。

---

# ■ エンドポイント仕様

### Method

```
POST /rtc/transports/{transportId}/connect
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
  "dtlsParameters": {
    "role": "auto",
    "fingerprints": [
      {
        "algorithm": "sha-256",
        "value": "12:34:56:..."
      }
    ]
  }
}
```

| フィールド       | 型     | 説明                                  |
| ---------------- | ------ | ------------------------------------- |
| `dtlsParameters` | object | mediasoup-client が生成する DTLS 情報 |

---

# ■ レスポンス（成功時）

### Status: 200 OK

```json
{
  "connected": true
}
```

---

# ■ エラーレスポンス

### 404 – Transport が存在しない

```json
{
  "error": "TRANSPORT_NOT_FOUND",
  "message": "Transportが存在しません。"
}
```

### 409 – Transport が既に接続済み

```json
{
  "error": "ALREADY_CONNECTED",
  "message": "TransportはすでにDTLS接続済みです。"
}
```

---

# ■ サーバー（Fastify + mediasoup）実装例

```tsx
fastify.post("/rtc/transports/:transportId/connect", async (request, reply) => {
  const { userId } = request.user;
  const { transportId } = request.params as { transportId: string };
  const { dtlsParameters } = request.body;

  const room = fastify.roomManager.getRoomByUserId(userId);
  if (!room) {
    return reply.status(404).send({
      error: "ROOM_NOT_FOUND",
      message: "通話ルームが見つかりません。",
    });
  }

  const transport = room.getTransportById(transportId);
  if (!transport) {
    return reply.status(404).send({
      error: "TRANSPORT_NOT_FOUND",
      message: "指定されたTransportは存在しません。",
    });
  }

  // DTLS接続（mediasoup側）
  await transport.connect({ dtlsParameters });

  return reply.send({ connected: true });
});
```

---

# ■ クライアント側（mediasoup-client）での利用例

```tsx
sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
  try {
    await fetch(`/rtc/transports/${sendTransport.id}/connect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dtlsParameters }),
    });

    callback(); // 成功
  } catch (err) {
    errback(err);
  }
});
```

ここで重要なのは：

- クライアントが _transport.connect()_ を呼ぶ →
- mediasoup が内部で DTLS パラメータを生成 →
- この API に POST →
- SFU 側の Transport が完全接続状態になる

という流れ。

---

# ■ この API の後にできること

sendTransport 接続後：

- RTC-04：produce（音声 Producer を作る）

recvTransport 接続後：

- RTC-05：consume（相手の音声を受信）

---

# ■ まとめ（差分観点）

| P2P                             | SFU（mediasoup）                                          |
| ------------------------------- | --------------------------------------------------------- |
| DTLS handshake は peer 間で自動 | **DTLS handshake を API 経由で SFU に伝える必要がある**   |
| signal イベントで SDP 交換      | **/rtc/transports/{id}/connect で DTLS パラメータを送信** |
| サーバー側は状態を知らない      | **SFU は接続状態を完全に把握可能**                        |

これにより、課金や接続監視に必要な「確実な状態管理」が可能になります。
