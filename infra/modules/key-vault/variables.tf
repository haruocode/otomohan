variable "name" {
  description = "Key Vault 名 (グローバルで一意)"
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

variable "sku_name" {
  description = "SKU (standard or premium)"
  type        = string
  default     = "standard"
}

variable "soft_delete_retention_days" {
  description = "論理削除保持日数"
  type        = number
  default     = 7
}

variable "purge_protection_enabled" {
  description = "パージ保護を有効にするか"
  type        = bool
  default     = false
}

variable "enable_rbac_authorization" {
  description = "RBAC 認可を有効にするか"
  type        = bool
  default     = false
}

variable "secrets" {
  description = "保存するシークレット"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "container_app_principal_id" {
  description = "Container App のマネージド ID プリンシパル ID"
  type        = string
  default     = null
}

variable "tags" {
  description = "タグ"
  type        = map(string)
  default     = {}
}
