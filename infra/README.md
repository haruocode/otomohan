# otomohan インフラストラクチャ

Azure 上に otomohan アプリケーションをデプロイするための Terraform コードです。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│  Azure Static Web Apps (Frontend)                               │
│  - React SPA (TanStack Router)                                  │
│  - CDN 配信・SSL 自動設定                                        │
└─────────────────┬───────────────────────────────────────────────┘
                  │ API / WebSocket
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Azure Container Apps (Backend)                                 │
│  - Fastify API (port 5051)                                      │
│  - WebSocket (通話シグナリング)                                  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┬─────────────────┐
    ▼             ▼             ▼                 ▼
┌────────┐  ┌──────────┐  ┌──────────┐    ┌───────────┐
│PostgreSQL│ │   ACS   │  │Key Vault │    │Log Analytics│
│Flexible │ │ (通話)  │  │(シークレット)│   │  (監視)    │
└────────┘  └──────────┘  └──────────┘    └───────────┘
```

## ディレクトリ構成

```
infra/
├── modules/                      # 再利用可能なモジュール
│   ├── resource-group/
│   ├── log-analytics/
│   ├── static-web-app/
│   ├── container-apps/
│   ├── postgresql/
│   ├── communication-services/
│   └── key-vault/
├── environments/                 # 環境別設定
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   └── prod/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars
├── versions.tf
├── providers.tf
├── backend.tf
└── README.md
```

## 前提条件

1. **Azure CLI** がインストールされていること
2. **Terraform** v1.5.0 以上がインストールされていること
3. Azure サブスクリプションにアクセスできること

## セットアップ

### 1. Azure にログイン

```bash
az login
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### 2. Terraform 初期化

```bash
cd infra/environments/dev
terraform init
```

### 3. 環境変数の設定

```bash
# PostgreSQL のパスワードを設定
export TF_VAR_db_admin_password="your-secure-password-here"
```

### 4. Plan の確認

```bash
terraform plan
```

### 5. デプロイ

```bash
terraform apply
```

## 環境別の違い

| 項目                    | Dev             | Prod               |
| ----------------------- | --------------- | ------------------ |
| PostgreSQL SKU          | B_Standard_B1ms | GP_Standard_D2s_v3 |
| PostgreSQL ストレージ   | 32GB            | 64GB               |
| PostgreSQL HA           | 無効            | 有効               |
| Container Apps レプリカ | 0-2             | 1-5                |
| Container Apps CPU      | 0.5             | 1.0                |
| Container Apps メモリ   | 1Gi             | 2Gi                |
| Static Web Apps SKU     | Free            | Standard           |
| Log Analytics 保持期間  | 30 日           | 90 日              |
| Key Vault パージ保護    | 無効            | 有効               |

## デプロイ後の設定

### フロントエンドのデプロイ

Static Web App にはデプロイ用の API キーが出力されます：

```bash
# API キーの取得
terraform output -raw frontend_api_key

# Azure Static Web Apps CLI でデプロイ
cd ../../../frontend
npm run build
npx @azure/static-web-apps-cli deploy ./dist \
  --deployment-token <API_KEY>
```

### バックエンドのデプロイ

Container Apps にはコンテナイメージをプッシュしてデプロイします：

```bash
# バックエンドイメージのビルド & プッシュ
cd ../../../backend
docker build -t ghcr.io/your-org/otomohan-backend:latest .
docker push ghcr.io/your-org/otomohan-backend:latest

# Terraform で backend_image を更新
terraform apply -var="backend_image=ghcr.io/your-org/otomohan-backend:latest"
```

### データベースマイグレーション

```bash
# 接続文字列の取得
terraform output -raw postgresql_connection_string

# マイグレーション実行
cd ../../../backend
DATABASE_URL="<CONNECTION_STRING>" npm run db:migrate
```

## 出力値

| 出力名                         | 説明                               |
| ------------------------------ | ---------------------------------- |
| `frontend_url`                 | フロントエンドの URL               |
| `frontend_api_key`             | Static Web App デプロイ用 API キー |
| `backend_url`                  | バックエンド API の URL            |
| `postgresql_fqdn`              | PostgreSQL サーバーの FQDN         |
| `postgresql_connection_string` | PostgreSQL 接続文字列              |
| `acs_connection_string`        | ACS 接続文字列                     |
| `key_vault_uri`                | Key Vault の URI                   |

## コスト見積もり（概算）

### Dev 環境

| リソース                      | 月額 (USD)   |
| ----------------------------- | ------------ |
| PostgreSQL B_Standard_B1ms    | ~$15         |
| Container Apps (0-2 replicas) | ~$0-20       |
| Static Web Apps Free          | $0           |
| ACS (従量課金)                | 利用量による |
| Log Analytics                 | ~$5          |
| **合計**                      | **~$20-40**  |

### Prod 環境

| リソース                           | 月額 (USD)    |
| ---------------------------------- | ------------- |
| PostgreSQL GP_Standard_D2s_v3 (HA) | ~$200         |
| Container Apps (1-5 replicas)      | ~$50-150      |
| Static Web Apps Standard           | ~$9           |
| ACS (従量課金)                     | 利用量による  |
| Log Analytics                      | ~$10          |
| **合計**                           | **~$270-370** |

## トラブルシューティング

### Terraform State のリセット

```bash
rm -rf .terraform terraform.tfstate*
terraform init
```

### リソースの強制削除

```bash
terraform destroy -target=module.container_apps
```

### Azure CLI でリソース確認

```bash
az resource list --resource-group rg-otomohan-dev --output table
```
