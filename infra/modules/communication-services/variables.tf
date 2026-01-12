variable "name" {
  description = "Azure Communication Services 名"
  type        = string
}

variable "resource_group_name" {
  description = "リソースグループ名"
  type        = string
}

variable "data_location" {
  description = "データの保存場所 (Japan, United States, Europe, UK, Australia)"
  type        = string
  default     = "Japan"
}

variable "tags" {
  description = "タグ"
  type        = map(string)
  default     = {}
}
