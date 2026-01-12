variable "name" {
  description = "リソースグループ名"
  type        = string
}

variable "location" {
  description = "Azure リージョン"
  type        = string
  default     = "japaneast"
}

variable "tags" {
  description = "リソースに付与するタグ"
  type        = map(string)
  default     = {}
}
