# Otomohan Mock Server

Express ベースのモック API サーバーです。フロントエンドのローカル開発時にバックエンド未整備のエンドポイントをスタブします。

## セットアップ

```bash
cd frontend/mock
npm install
```

## 実行

開発モード（ホットリロード）

```bash
npm run dev
```

本番相当モード

```bash
npm start
```

## エンドポイント一覧

| Method | Path             | 概要                             |
| ------ | ---------------- | -------------------------------- |
| GET    | /health          | サーバーヘルスチェック           |
| GET    | /wallet/balance  | ポイント残高モック               |
| GET    | /wallet/plans    | チャージプラン一覧               |
| POST   | /wallet/charge   | 疑似チャージ処理                 |
| GET    | /otomo           | おともはん一覧                   |
| GET    | /otomo/:id       | おともはん詳細                   |
| GET    | /calls           | 通話履歴一覧                     |
| GET    | /calls/:id       | 通話詳細                         |
| POST   | /calls/debug/end | デバッグ強制終了イベント擬似生成 |

必要に応じて `src/routes` 配下へエンドポイントを追加してください。
