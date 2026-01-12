variable "db_admin_username" {
  description = "PostgreSQL 管理者ユーザー名"
  type        = string
  default     = "pgadmin"
}

variable "db_admin_password" {
  description = "PostgreSQL 管理者パスワード"
  type        = string
  sensitive   = true
}

variable "backend_image" {
  description = "バックエンド コンテナイメージ"
  type        = string
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest" # 初期デプロイ用ダミー
}

variable "app_version" {
  description = "アプリバージョン"
  type        = string
  default     = "1.0.0"
}

variable "min_app_version" {
  description = "最小対応アプリバージョン"
  type        = string
  default     = "1.0.0"
}
