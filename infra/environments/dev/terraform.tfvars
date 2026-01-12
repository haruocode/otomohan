# Dev 環境変数
# terraform apply -var-file=terraform.tfvars

db_admin_username = "pgadmin"
# db_admin_password は環境変数 TF_VAR_db_admin_password で設定
# export TF_VAR_db_admin_password="your-secure-password"

app_version     = "1.0.0"
min_app_version = "1.0.0"

# backend_image は CI/CD でオーバーライド
# backend_image = "ghcr.io/your-org/otomohan-backend:latest"
