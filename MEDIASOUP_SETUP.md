# mediasoup 統合セットアップガイド

このドキュメントでは、Fastify アプリケーションに mediasoup サーバーを統合する手順を説明します。

## 実装状況

✅ **完了**:

- mediasoup-server の独立したプロジェクト構成
- WorkerPool、RouterManager、RtpMonitor、RpcServer の実装
- WebSocket RPC 通信プロトコル
- Fastify アプリ用 mediasoupClient
- Docker 対応

⏳ **次のステップ**:

1. package.json に必要な依存関係を追加
2. mediasoupClient を RTC サービスに統合
3. 動作テスト

## Step 1: package.json を更新

### mediasoup-server の package.json

```bash
cd backend/mediasoup-server
npm install
```

### backend の package.json に ws を追加

```bash
cd backend
npm install ws
npm install --save-dev @types/ws
```

## Step 2: app.ts に mediasoup クライアント初期化を追加

```typescript
import { initializeMediasoupClient } from "./mediasoup/mediasoup-client.js";

async function build(opts?: FastifyServerOptions) {
  const app = fastify(opts);

  // mediasoupサーバーに接続
  try {
    const mediasoupUrl = process.env.MEDIASOUP_URL || "ws://127.0.0.1:8888";
    await initializeMediasoupClient(mediasoupUrl);
    console.log("✅ mediasoup client connected");
  } catch (err) {
    console.error("❌ Failed to connect to mediasoup:", err);
    // 非致命的エラーとして扱う（ローカル開発用）
  }

  // ... 他の初期化処理
}
```

## Step 3: RTC サービスを mediasoup に対応させる

### rtcTransportService.ts の修正例

```typescript
import { getMediasoupClient } from "../mediasoup/mediasoup-client.js";

export async function createTransportForParticipant(options: {
  callId: string;
  requesterUserId: string;
  direction: TransportDirection;
}): Promise<CreateTransportResult> {
  // ... 既存の検証ロジック ...

  const mediasoupClient = getMediasoupClient();

  try {
    // mediasoup サーバーで router を作成/取得
    const routerId = `call-${callId}`;
    await mediasoupClient.createRouter(routerId);

    // Transport を作成
    const transportId = randomUUID();
    const transportDesc = await mediasoupClient.createTransport(
      routerId,
      transportId,
      options.requesterUserId,
      call.otomoId
    );

    // ローカルストレージに保存
    saveTransport({
      id: transportDesc.id,
      callId: options.callId,
      direction: options.direction,
      iceParameters: transportDesc.iceParameters,
      iceCandidates: transportDesc.iceCandidates,
      dtlsParameters: transportDesc.dtlsParameters,
    });

    return {
      success: true,
      transport: {
        id: transportDesc.id,
        iceParameters: transportDesc.iceParameters,
        iceCandidates: transportDesc.iceCandidates,
        dtlsParameters: transportDesc.dtlsParameters,
      },
      reused: false,
    };
  } catch (err) {
    console.error("Failed to create transport:", err);
    return { success: false, reason: "INVALID_STATE" };
  }
}
```

## Step 4: Docker Compose で起動

```bash
cd backend

# mediasoup サーバーを起動
docker-compose up mediasoup

# 別のターミナルで Fastify を起動（ローカル開発）
npm run dev
```

## Step 5: テスト

### mediasoup サーバーの確認

```bash
# WebSocket接続確認
nc -zv 127.0.0.1 8888
# または
telnet 127.0.0.1 8888
```

### API エンドポイントのテスト

```bash
# RTC-01: Router RTP Capabilities を取得
curl -X GET http://localhost:3000/rtc/capabilities \
  -H "Authorization: Bearer <token>"

# RTC-02: Transport を作成
curl -X POST http://localhost:3000/rtc/transports \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"callId":"<call-id>","direction":"send"}'
```

## トラブルシューティング

### mediasoup サーバーが起動しない

```bash
# Docker ログを確認
docker-compose logs mediasoup

# mediasoup-server の npm install を確認
cd backend/mediasoup-server
npm install
npm run build
```

### WebSocket 接続が失敗する

```bash
# mediasoup サーバーがリッスンしているか確認
netstat -an | grep 8888

# または Docker コンテナ内での確認
docker-compose exec mediasoup netstat -an | grep 8888
```

### RTP が流れていない

1. クライアントが正しく Producer を作成しているか確認
2. ファイアウォールで RTC ポート（40000-41000）が開いているか確認
3. mediasoup ログで DTLS 接続を確認

## 環境変数

```env
# .env
MEDIASOUP_URL=ws://127.0.0.1:8888  # 本番環境では FQDN を使用
DATABASE_URL=postgres://...
JWT_SECRET=...
```

## パフォーマンスチューニング

### メモリ使用量削減

```typescript
// mediasoup-server/src/index.ts
const workerPool = new WorkerPool({
  numWorkers: 2, // CPU コア数に合わせる
  logLevel: "warn", // "warn" または "error"
});
```

### RTP 監視間隔の調整

```typescript
const rtpMonitor = new RtpMonitor({
  heartbeatIntervalMs: 10000, // 10 秒に延長
  silenceThresholdMs: 15000, // 15 秒でサイレント判定
});
```

## 本番環境での注意事項

1. **TURN サーバー**: NAT 越え対応に TURN サーバーを準備
2. **SSL/TLS**: mediasoup サーバーを WSS (ws://wss) で保護
3. **リソース管理**: 通話終了時に確実に Transport/Producer/Consumer をクローズ
4. **監視**: mediasoup サーバーの CPU/メモリを定期的に監視

## 次のステップ

1. ✅ mediasoup サーバーの起動確認
2. ⏳ RTC API と mediasoup の統合テスト
3. ⏳ 実際の WebRTC 通話でのテスト（クライアント mediasoup-client を使用）
4. ⏳ 複数 Router 対応のテスト（複数通話の同時実行）
