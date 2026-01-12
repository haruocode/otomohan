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

variable "cors_allowed_origins" {
  description = "CORS 許可オリジン"
  type        = list(string)
  default     = []
}

variable "custom_domain" {
  description = "カスタムドメイン (オプション)"
  type        = string
  default     = null
}
