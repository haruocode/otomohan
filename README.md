# おともはんプロジェクト

このレポジトリは激しく開発中です。

「おともはん」は WebRTC（mediasoup or ACS）ベースで音声通話を提供するサービスの開発リポジトリです。バックエンド、フロントエンド、インフラ定義、そして要件～詳細設計ドキュメントをこの単一リポジトリで管理しています。

## Repository Layout

| Path      | Description                                                            |
| --------- | ---------------------------------------------------------------------- |
| backend/  | API ・ WebSocket ・ WebRTC 制御のサーバーサイド実装（将来追加予定）。  |
| frontend/ | SPA / Web UI 実装。`frontend/mock` に Express 製モックサーバーを同梱。 |
| infra/    | IaC、コンテナ、監視などのインフラ定義領域。                            |
| docs/     | 基本設計 / 詳細設計をまとめたドキュメント群。            |

## Documentation Map (docs/specification)

### 基本設計

- `docs/specification/基本設計/機能一覧.md`
  - 共通・ユーザー・おともはん・管理者向け機能、WebRTC 連携機能の全体像。
- `docs/specification/基本設計/データベース設計.md`
  - users / wallets / calls / call_events などのテーブルスキーマと運用方針。
- `docs/specification/基本設計/インフラ設計(未着手).md`
  - 想定しているインフラ構成の叩き台（未着手メモ）。

### 詳細設計

- `docs/specification/詳細設計/API設計/`
  - REST / WebSocket / WebRTC API ごとのリクエスト・レスポンス定義。
- `docs/specification/詳細設計/画面設計/`
  - 画面一覧、ユーザー・おともはん・管理画面 UI 仕様、ローカル開発環境構築手順。
- `docs/specification/詳細設計/通話系/`
  - 通話ステートマシン、異常切断判定、課金ロジックなど。

> **機密保持**: `docs/` 以下は設計資料（認証情報やネットワーク構成例を含む）なので社内限定で取り扱ってください。

## Mock API Server (frontend/mock)

- `npm run dev` でポート 5050 で起動。
- `/wallet/*` `/otomo/*` `/calls/*` などのモックエンドポイントを提供し、フロントエンドの結合テストに利用できます。
- 詳細は `frontend/mock/README.md` を参照。

## Getting Started

1. リポジトリ直下で `git submodule` 等は不要です。
2. バックエンド／フロントエンド／モックサーバーはそれぞれのディレクトリで `npm install` or `pnpm install` を実行してください。
3. ローカル開発環境（Fastify + PostgreSQL + coturn）を再現する場合は `docs/specification/詳細設計/画面設計/ローカル開発環境構築.md` の Docker Compose 手順を参照します。

上記をベースに、必要なサービスごとに README や設計資料を追加していってください。
