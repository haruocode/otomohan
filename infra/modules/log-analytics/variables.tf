variable "name" {
  description = "Log Analytics Workspace 名"
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

variable "sku" {
  description = "SKU (PerGB2018 推奨)"
  type        = string
  default     = "PerGB2018"
}

variable "retention_in_days" {
  description = "ログ保持日数"
  type        = number
  default     = 30
}

variable "tags" {
  description = "タグ"
  type        = map(string)
  default     = {}
}
