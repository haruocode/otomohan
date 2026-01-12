variable "name" {
  description = "PostgreSQL サーバー名"
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

variable "postgresql_version" {
  description = "PostgreSQL バージョン"
  type        = string
  default     = "16"
}

variable "administrator_login" {
  description = "管理者ユーザー名"
  type        = string
  default     = "pgadmin"
}

variable "administrator_password" {
  description = "管理者パスワード"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "データベース名"
  type        = string
  default     = "otomohan"
}

variable "sku_name" {
  description = "SKU 名 (例: B_Standard_B1ms, GP_Standard_D2s_v3)"
  type        = string
  default     = "B_Standard_B1ms" # 開発向け最小構成
}

variable "storage_mb" {
  description = "ストレージサイズ (MB)"
  type        = number
  default     = 32768 # 32GB
}

variable "backup_retention_days" {
  description = "バックアップ保持日数"
  type        = number
  default     = 7
}

variable "geo_redundant_backup_enabled" {
  description = "地理冗長バックアップを有効にするか"
  type        = bool
  default     = false
}

variable "public_network_access_enabled" {
  description = "パブリックネットワークアクセスを許可するか"
  type        = bool
  default     = true
}

variable "zone" {
  description = "可用性ゾーン"
  type        = string
  default     = "1"
}

variable "high_availability_enabled" {
  description = "高可用性を有効にするか"
  type        = bool
  default     = false
}

variable "standby_zone" {
  description = "スタンバイの可用性ゾーン"
  type        = string
  default     = "2"
}

variable "allow_azure_services" {
  description = "Azure サービスからのアクセスを許可するか"
  type        = bool
  default     = true
}

variable "firewall_rules" {
  description = "追加のファイアウォールルール"
  type = map(object({
    start_ip = string
    end_ip   = string
  }))
  default = {}
}

variable "tags" {
  description = "タグ"
  type        = map(string)
  default     = {}
}
