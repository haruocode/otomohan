# RTC-01：GET /rtc/capabilities（Router RTP Capabilities を返す）

これは **SFU（mediasoup）で最初に呼ばれる API** で、クライアントが自身の `device.load()` をするために必要な情報を返します。

---

## ■ 目的

クライアント（ユーザー / おともはん）が WebRTC 通話を開始する前に、

- どんな音声コーデックを SFU（Router）が扱えるか
- RTP パラメータ
- 拡張ヘッダー設定

などをクライアントに知らせ、クライアントの mediasoup-clientの`device.load(routerRtpCapabilities)` を成功させるための API。

---

# ■ エンドポイント仕様

### Method

```
GET /rtc/capabilities
```

### 認証

- 必須（通話参加者のみが呼べるようにする）
- Header：

```
Authorization: Bearer <token>
```

---

# ■ リクエストパラメータ

なし

---

# ■ レスポンス（成功時）

### Status: 200 OK

内容は mediasoup Router の `router.rtpCapabilities` をそのまま返します。

例：

```json
{
  "rtpCapabilities": {
    "codecs": [
      {
        "kind": "audio",
        "mimeType": "audio/opus",
        "clockRate": 48000,
        "channels": 2,
        "parameters": {
          "useinbandfec": 1
        },
        "rtcpFeedback": [
          { "type": "transport-cc" }
        ]
      }
    ],
    "headerExtensions": [
      {
        "kind": "audio",
        "uri": "urn:ietf:params:rtp-hdrext:sdes:mid",
        "preferredId": 1,
        "preferredEncrypt": false,
        "direction": "sendrecv"
      },
      {
        "kind": "audio",
        "uri": "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
        "preferredId": 2,
        "preferredEncrypt": false,
        "direction": "sendrecv"
      }
    ]
  }
}
```

---

# ■ レスポンス項目説明

| フィールド | 説明 |
| --- | --- |
| `codecs` | SFUが扱えるコーデック一覧（音声ならほぼ opus） |
| `headerExtensions` | RTPヘッダー拡張設定 |
| `fec` / `rtcpFeedback` | 再送制御、帯域推定系の設定 |

→ **クライアントはこのデータを mediasoup-client にそのまま渡すだけ** です。

---

# ■ エラーレスポンス

### 401 Unauthorized

認証トークンが無効

```json
{
  "error": "UNAUTHORIZED",
  "message": "認証が必要です。"
}
```

### 500 Internal Server Error

Router が生成されていない、または内部エラー

```json
{
  "error": "INTERNAL_ERROR",
  "message": "RTP Capabilities の取得に失敗しました。"
}
```

---

# ■ Fastify + mediasoup の実装例（TypeScript）

```tsx
fastify.get("/rtc/capabilities", async (request, reply) => {
  const { userId } = request.user;

  // 通話中のRoomを特定する必要がある場合：
  // const room = roomManager.getRoomByUserId(userId);
  // const router = room.router;

  // 今回は単一Router前提の例
  const router = fastify.mediasoup.router;

  if (!router) {
    return reply.status(500).send({
      error: "INTERNAL_ERROR",
      message: "Router is not initialized."
    });
  }

  return reply.send({
    rtpCapabilities: router.rtpCapabilities
  });
});
```

---

# ■ クライアント側（mediasoup-client）の利用例

```tsx
import { Device } from "mediasoup-client";

const device = new Device();

const res = await fetch("/rtc/capabilities", {
  headers: { Authorization: `Bearer ${token}` }
});

const { rtpCapabilities } = await res.json();

// これでmediasoup-client側の初期化が完了する
await device.load({ routerRtpCapabilities: rtpCapabilities });
```

→ これが成功すれば、次に sendTransport / recvTransport を作れる。

---

# ■ この API が必要な理由（P2P との差分）

P2Pでは：

- クライアント間で SDP を投げ合うことで、
    
    お互いの RTP 受付能力を自動で交換していた。
    

SFUでは：

- クライアントは **Router（サーバー）と通信する**
- そのため、Router の能力（rtpCapabilities）を事前に取得して
    
    `device.load()` の中で **SDPを内部生成**する必要がある。
    

つまり：

> P2Pの WS-C05（signal）で交換していた処理の一部を、このAPIが担当する。
> 

---

# ■ まとめ

| 項目 | P2P | SFU（mediasoup） |
| --- | --- | --- |
| RTP能力交換 | クライアント同士のSDP交換 | **/rtc/capabilities でサーバー（Router）から取得** |
| 必要か？ | 不要 | **必須** |
| 使用箇所 | なし | **device.load() 前に必ず呼ぶ** |