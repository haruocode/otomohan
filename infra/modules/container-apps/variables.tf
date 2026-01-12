variable "environment_name" {
  description = "Container Apps Environment 名"
  type        = string
}

variable "app_name" {
  description = "Container App 名"
  type        = string
}

variable "location" {
  description = "Azure リージョン"
  type        = string
}

variable "resource_group_name" {
  description = "リソースグループ名"
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID"
  type        = string
}

variable "container_image" {
  description = "コンテナイメージ (例: ghcr.io/org/repo:tag)"
  type        = string
}

variable "target_port" {
  description = "コンテナのリッスンポート"
  type        = number
  default     = 5051
}

variable "cpu" {
  description = "CPU コア数"
  type        = number
  default     = 0.5
}

variable "memory" {
  description = "メモリ (例: 1Gi)"
  type        = string
  default     = "1Gi"
}

variable "min_replicas" {
  description = "最小レプリカ数"
  type        = number
  default     = 0
}

variable "max_replicas" {
  description = "最大レプリカ数"
  type        = number
  default     = 3
}

variable "environment_variables" {
  description = "環境変数 (プレーンテキスト)"
  type        = map(string)
  default     = {}
}

variable "secret_environment_variables" {
  description = "シークレット参照の環境変数 (キー: 環境変数名, 値: シークレット名)"
  type        = map(string)
  default     = {}
}

variable "secrets" {
  description = "シークレット定義"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "cors_allowed_origins" {
  description = "CORS 許可オリジン"
  type        = list(string)
  default     = null
}

variable "tags" {
  description = "タグ"
  type        = map(string)
  default     = {}
}
