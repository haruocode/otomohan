# Production 環境変数
# terraform apply -var-file=terraform.tfvars

db_admin_username = "pgadmin"
# db_admin_password は環境変数 TF_VAR_db_admin_password で設定
# export TF_VAR_db_admin_password="your-secure-password"

app_version     = "1.0.0"
min_app_version = "1.0.0"

# CORS 許可オリジン（本番ドメインを指定）
cors_allowed_origins = [
  "https://otmhn.app",
  # "https://www.otmhn.app"
]

# カスタムドメイン（DNS設定後に有効化）
# custom_domain = "otmhn.app"

# backend_image は CI/CD でオーバーライド
# backend_image = "ghcr.io/your-org/otomohan-backend:v1.0.0"
