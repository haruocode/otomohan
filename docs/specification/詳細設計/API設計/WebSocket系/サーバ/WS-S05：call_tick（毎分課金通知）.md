# WS-S05：call_tick（毎分課金通知）

## ゴールのおさらい

- P2P 版：
  「とりあえず `call_connected` のあとサーバーでタイマー回してた」
- SFU 版：
  **「SFU が“まだ本当に通話中（RTP が流れている）”であることを確認しながら、毎分安全に課金」**

という形にアップデートします。

---

## SFU 版 WS-S05 call_tick の基本仕様

### イベント名

- type: `"call_tick"`

### 送信方向

- `Server → User`
- `Server → Otomo`

毎分、両者に同じ情報を送信。

---

## メッセージ仕様（JSON）

```json
{
  "type": "call_tick",
  "payload": {
    "callId": "call_abc123",
    "tickNumber": 3,
    "chargedPoints": 120,
    "totalChargedPoints": 360,
    "durationSeconds": 180,
    "userBalance": 840,
    "timestamp": "2025-01-15T12:05:00.000Z",
    "status": "ok"
  }
}
```

### フィールド説明

| フィールド           | 説明                                                  |
| -------------------- | ----------------------------------------------------- |
| `callId`             | 通話 ID                                               |
| `tickNumber`         | 何回目の課金か（1,2,3…）                              |
| `chargedPoints`      | 今回の 1 分で減算されたポイント数                     |
| `totalChargedPoints` | 通話開始からの累計消費ポイント                        |
| `durationSeconds`    | 通話開始からの累計秒数（サーバー基準）                |
| `userBalance`        | tick 処理後のユーザー残高（WAL-01 と一致する値）      |
| `timestamp`          | この tick を確定したサーバー時間                      |
| `status`             | `"ok"` / `"low_balance"` / `"ended"` などの状態フラグ |

---

## 課金のトリガーとなる前提条件（SFU 版）

**毎分課金が走るのは以下の条件が揃ったときだけ：**

1. `call_connected` が SFU から送信済み
   - ＝ 少なくとも一度は RTP を受信済み
2. SFU が **直近一定期間 RTP を受信し続けている**
   - 例：直近 10 秒以内に RTP trace が来ている
3. 通話状態が `talking`（内部ステートマシン）

これを満たさないと tick は発火しません。

---

## サーバー側のロジック（概要）

### 1. 通話開始時

- SFU が RTP を検知 → `WS-S04 call_connected`
- このタイミングでサーバー内に **課金タイマーを登録**

```tsx
startBillingTimer(callId, userId, otomoId, pricePerMinute);
```

### 2. 課金タイマー（擬似コード）

```tsx
function startBillingTimer(callId, userId, otomoId, pricePerMinute) {
  let tickNumber = 0;
  let totalChargedPoints = 0;

  const interval = setInterval(async () => {
    const call = await db.call.findUnique({ where: { callId } });
    if (!call || call.status !== "talking") {
      clearInterval(interval);
      return;
    }

    // SFU がまだ RTP を受信しているか？
    if (!roomManager.isRtpAlive(callId)) {
      // RTPが止まったら通話終了へ進める（call_end 側のロジック）
      clearInterval(interval);
      return;
    }

    tickNumber += 1;

    const result = await billingService.chargeOneMinute({
      callId,
      userId,
      otomoId,
      pricePerMinute
    });

    totalChargedPoints += result.chargedPoints;

    // WebSocket 通知
    wsServer.sendTo(userId, {
      type: "call_tick",
      payload: {
        callId,
        tickNumber,
        chargedPoints: result.chargedPoints,
        totalChargedPoints,
        durationSeconds: tickNumber * 60,
        userBalance: result.userBalance,
        timestamp: new Date().toISOString(),
        status: result.status   // "ok" | "low_balance" | "ended"
      }
    });

    wsServer.sendTo(otomoId, { ...同じpayload... });

    if (result.status === "ended") {
      clearInterval(interval);
      // call_end 側で通話終了へ
    }
  }, 60_000);
}
```

---

## ポイント減算の中身（billingService 側）

### 入出力イメージ

```tsx
type ChargeResult = {
  chargedPoints: number;
  userBalance: number;
  status: "ok" | "low_balance" | "ended";
};
```

### 処理方針

1. WAL-01 のウォレットから現在残高取得
2. 1 分あたりの料金 `pricePerMinute` と比較
3. ルール例：

- 残高 **>= 1 分分** → 正常課金（`status: "ok"`）
- 残高 **> 0 かつ < 1 分分** →
  残高すべてを消費して `status: "ended"` として **強制終了トリガー**
- 残高 **<= 0** → 課金せず `status: "ended"`（直後に通話終了）

この結果を元に `call_tick` を飛ばし、

`status: "low_balance"` / `"ended"` の場合には

**フロント UI で「残りわずか」「通話終了」メッセージに使える**。

---

## クライアント側（ユーザー / おともはん）の挙動

### 受信例（ユーザー側）

```tsx
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "call_tick") {
    const p = msg.payload;

    updatePointUI(p.userBalance);
    updateCallDuration(Math.floor(p.durationSeconds / 60)); // 分数表示

    if (p.status === "low_balance") {
      showToast("ポイント残りわずかです");
    }

    if (p.status === "ended") {
      showToast("ポイントがなくなったため通話を終了します");
      // 通話終了画面へ遷移など
    }
  }
};
```

おともはん側も同様に、

**「この通話でいま何分目か」「これまで何ポイント発生しているか」** を UI 表示に利用できます。

---

## P2P 版 → SFU 版での大きな違い

| 項目                                 | P2P 版                                  | SFU 版                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------ |
| tick 開始条件                        | クライアント自己申告の `call_connected` | **SFU が RTP を検知した `call_connected`** |
| tick 継続条件                        | サーバー内タイマーのみ                  | **RTP が生きているかを毎回チェック**       |
| 不正対策                             | 自己申告なので弱い                      | **ユーザー側は偽装不可**                   |
| 「無音なのに課金」リスク             | あり（片側ネット落ちなど）              | SFU 側で RTP 停止検知 → tick も止まる      |
| 「繋がってるのに課金されない」リスク | 実装次第であり得る                      | SFU ベースなのでかなり低い                 |

---

## CALL / WAL 系 API との関係

- `call_tick` は **DB 更新済みの結果を知らせる「通知」** に徹する
- ウォレットの実際の残高は常に WAL 系 REST API と一致
  - WAL-01: `/wallet/balance` … `userBalance` と同じ値
  - WAL-05: `/wallet/usage` … 通話終了後、1 通話分としてサマリ登録
- 通話履歴は CALL 系 API：
  - CALL-03: `/calls/{callId}/billing` などで
    **tick ごとの内訳を確認**できるようにする

---

## まとめ

- **WS-S05 call_tick は「SFU が通話継続中であることを確認済みの毎分課金通知」へアップデート**
- 課金タイミングはすべてサーバー・SFU 起点で管理
- status フラグで「通常／残少／終了」をフロントに伝えられる
- P2P 時代の不安（「切れてるのに課金された」「まだ繋がってるのに課金されない」）をかなり潰せる
