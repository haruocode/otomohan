variable "name" {
  description = "Static Web App 名"
  type        = string
}

variable "location" {
  description = "Azure リージョン (Static Web App は eastasia 推奨)"
  type        = string
  default     = "eastasia"
}

variable "resource_group_name" {
  description = "リソースグループ名"
  type        = string
}

variable "sku_tier" {
  description = "SKU Tier (Free or Standard)"
  type        = string
  default     = "Free"
}

variable "sku_size" {
  description = "SKU Size (Free or Standard)"
  type        = string
  default     = "Free"
}

variable "custom_domain" {
  description = "カスタムドメイン (オプション)"
  type        = string
  default     = null
}

variable "tags" {
  description = "タグ"
  type        = map(string)
  default     = {}
}
