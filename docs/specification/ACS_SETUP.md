# Azure Communication Services セットアップガイド

このドキュメントでは、Otomohan の音声通話機能に使用する Azure Communication Services (ACS) のセットアップ手順を説明します。

## 概要

Otomohan では、ユーザーとオトモ間の音声通話に Azure Communication Services を使用しています。

- **バックエンド**: ACS アクセストークンの発行
- **フロントエンド**: ACS Calling SDK による音声通話

## Step 1: Azure Communication Services リソースの作成

### 1.1 Azure Portal にログイン

[Azure Portal](https://portal.azure.com) にアクセスしてログインします。

### 1.2 リソースの作成

1. 上部の検索バーで「**Communication Services**」を検索
2. 「**Communication Services**」をクリック
3. 「**+ 作成**」ボタンをクリック

### 1.3 基本情報の入力

| 項目               | 値                                      |
| ------------------ | --------------------------------------- |
| サブスクリプション | 使用するサブスクリプションを選択        |
| リソースグループ   | 既存のものを選択、または新規作成        |
| リソース名         | `otomohan-acs`（任意）                  |
| データの場所       | `Japan`（推奨）または最寄りのリージョン |

4. 「**確認および作成**」→「**作成**」をクリック

### 1.4 接続文字列の取得

1. リソースのデプロイ完了後、「**リソースに移動**」をクリック
2. 左メニューの「**設定**」→「**キー**」を選択
3. 「**接続文字列**」（プライマリまたはセカンダリ）をコピー

```
endpoint=https://otomohan-acs.japaneast.communication.azure.com/;accesskey=xxxxx...
```

## Step 2: 環境変数の設定

### 2.1 バックエンド

`backend/.env` に以下を追加：

```bash
ACS_CONNECTION_STRING=endpoint=https://otomohan-acs.japaneast.communication.azure.com/;accesskey=xxxxx...
```

### 2.2 本番環境

本番環境では、Azure Key Vault や環境変数として安全に管理してください。

```bash
# Azure App Service の場合
az webapp config appsettings set \
  --name <app-name> \
  --resource-group <resource-group> \
  --settings ACS_CONNECTION_STRING="<connection-string>"
```

## Step 3: 動作確認

### 3.1 バックエンド起動

```bash
cd backend
npm run dev
```

### 3.2 トークン取得テスト

```bash
# JWT トークンを取得した状態で
curl -X POST http://localhost:5051/acs/token \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json"
```

レスポンス例：

```json
{
  "acsUserId": "8:acs:xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx_00000000-0000-0000-0000-xxxxxxxxxxxx",
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwNiIsIng1dCI...",
  "expiresOn": "2026-01-13T12:00:00.000Z"
}
```

## アーキテクチャ

```
┌─────────────┐       ┌─────────────┐       ┌─────────────────────┐
│  Frontend   │──────▶│   Backend   │──────▶│  Azure Communication│
│  (Browser)  │       │  (Fastify)  │       │      Services       │
└─────────────┘       └─────────────┘       └─────────────────────┘
      │                     │
      │ 1. POST /acs/token  │
      │────────────────────▶│
      │                     │ 2. createUserAndToken()
      │                     │───────────────────────▶
      │                     │◀───────────────────────
      │◀────────────────────│ 3. { acsUserId, token }
      │
      │ 4. CallClient.createCallAgent(token)
      │
      │ 5. callAgent.startCall()
      │─────────────────────────────────────────────▶
      │                                              │
      │                   音声通話（P2P/TURN）        │
      │◀────────────────────────────────────────────▶│
```

## 料金

Azure Communication Services の料金は使用量ベースです：

| 機能                     | 料金（参考）      |
| ------------------------ | ----------------- |
| 音声通話（VoIP to VoIP） | 約 ¥0.4/分/参加者 |
| トークン発行             | 無料              |

最新の料金は [Azure 料金計算ツール](https://azure.microsoft.com/ja-jp/pricing/calculator/) をご確認ください。

## トラブルシューティング

### 「Invalid connection string」エラー

- 接続文字列の形式を確認（`endpoint=...;accesskey=...`）
- 余分な空白や改行がないか確認

### 「Unauthorized」エラー

- 接続文字列のアクセスキーが正しいか確認
- Azure Portal でキーを再生成して試す

### フロントエンドで通話が開始できない

- ブラウザのマイク許可を確認
- HTTPS 環境で実行しているか確認（localhost は HTTP でも可）
- コンソールログでエラーを確認

## 関連リンク

- [Azure Communication Services ドキュメント](https://learn.microsoft.com/ja-jp/azure/communication-services/)
- [Calling SDK クイックスタート](https://learn.microsoft.com/ja-jp/azure/communication-services/quickstarts/voice-video-calling/getting-started-with-calling)
- [料金](https://azure.microsoft.com/ja-jp/pricing/details/communication-services/)
