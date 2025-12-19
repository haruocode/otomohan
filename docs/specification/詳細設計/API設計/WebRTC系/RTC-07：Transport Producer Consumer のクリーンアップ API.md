# RTC-07：Transport / Producer / Consumer のクリーンアップ API

これは **通話終了時や異常切断時に SFU（mediasoup）上のリソースを安全に破棄**するための API で、サービス運用の安定性に大きく関わる重要な部分です。

---

# なぜクリーンアップ API が必要か？

mediasoup の Transport / Producer / Consumer は

- **音声送信のたびに生成されるオブジェクト**
- **各クライアントの切断やエラー時に自動で消えないことも多い**

これを適切に破棄しないと：

- SFU のメモリリーク
- ghost Transport / Producer の残骸
- 部屋が永遠に閉じない
- 通話再接続が失敗する
- コストが増える

などの問題が発生します。そのため、**通話が終わった時点で必ずサーバー側でクリーンアップ処理を行う API が必要です。**

---

## ■ 目的

- 通話ごとに作られた mediasoup リソース（Transport / Producer / Consumer）をまとめて破棄する
- callId 単位で部屋（Room）を閉じる
- 再接続時に前のリソースが残って邪魔しないようにする

---

# ■ エンドポイント仕様

### Method

```
DELETE /rtc/rooms/{callId}/cleanup
```

### 認証

必須（通話関係者のみ）

```
Authorization: Bearer <token>
```

---

# ■ リクエストパラメータ

URL Path:

- `callId`: 通話ID

Body の指定は不要。

---

# ■ レスポンス（成功時）

### 200 OK

```json
{
  "cleaned": true,
  "released": {
    "transports": 2,
    "producers": 2,
    "consumers": 2
  }
}
```

---

# ■ エラーレスポンス

### 404 Room が存在しない

```json
{
  "error": "ROOM_NOT_FOUND",
  "message": "指定された callId の Room は存在しません。"
}
```

---

# ■ サーバー実装例（Fastify + mediasoup）

```tsx
fastify.delete("/rtc/rooms/:callId/cleanup", async (request, reply) => {
  const { callId } = request.params;
  const { userId } = request.user;

  const room = fastify.roomManager.get(callId);
  if (!room) {
    return reply.status(404).send({
      error: "ROOM_NOT_FOUND",
      message: "Room が見つかりません。"
    });
  }

  // このユーザーがこの callId の当事者か確認
  if (!room.isParticipant(userId)) {
    return reply.status(403).send({
      error: "FORBIDDEN",
      message: "この Room のクリーンアップ権限がありません。"
    });
  }

  const released = room.cleanup(); // すべて破棄

  return reply.send({
    cleaned: true,
    released
  });
});
```

---

# ■ Room.cleanup() の内部イメージ（非常に重要）

```tsx
class Room {
  cleanup() {
    let released = {
      transports: 0,
      producers: 0,
      consumers: 0
    };

    // Producer -> Consumer の順で閉じる
    for (const consumer of this.consumers.values()) {
      consumer.close();
      released.consumers++;
    }

    for (const producer of this.producers.values()) {
      producer.close();
      released.producers++;
    }

    // Transport は最後に閉じる
    for (const transport of this.transports.values()) {
      transport.close();
      released.transports++;
    }

    // Router は Room を破棄するときのみ
    // this.router.close(); ← 多拠点想定時は注意

    // Room を RoomManager から削除
    roomManager.delete(this.callId);

    return released;
  }
}
```

---

# ■ どのタイミングで呼ぶべき？

必須ポイント：

### ✔ 1. 通話終了時（call_end）

- WS-S07 call_end
- or API CALL-02 /calls/{callId} の終了処理完了後
    
    → この Cleanup API を呼ぶ
    

### ✔ 2. WebSocket が切れたとき（異常切断）

→ サーバーがタイムアウト検知して Cleanup

### ✔ 3. 再接続時に前の Transport を削除する必要がある場合

### ✔ 4. 通話の相手が拒否した・キャンセルしたとき

**通話状態が “終わった” と判定されたら必ず Cleanup 呼び出し**

---

# ■ P2P と SFU の大きな差分ポイント

| 項目 | P2P | SFU |
| --- | --- | --- |
| リソース管理 | クライアント任せ | **サーバー側で Transport / Producer / Consumer の責任管理が必要** |
| Cleanup | 不要（PeerConnection を閉じるだけ） | **必須（管理しないとリークして死ぬ）** |
| 破棄責任 | クライアント | **運営側（SFU）** |

---

# ■ Cleanup API がないと起こる最悪のケース

- “幽霊 Transport” が残り
- SFU の CPU 使用率が上昇
- 再接続ができない
- 数時間後に SFU 落ちる
- 他の通話に影響
- サービス崩壊

mediasoup は高速ですが、Transport が数百も残るとパフォーマンスに大きく影響が出ます。

**商用レベルでは Cleanup は必須機能です。**