output "id" {
  description = "PostgreSQL サーバー ID"
  value       = azurerm_postgresql_flexible_server.main.id
}

output "fqdn" {
  description = "PostgreSQL サーバーの FQDN"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "database_name" {
  description = "データベース名"
  value       = azurerm_postgresql_flexible_server_database.main.name
}

output "connection_string" {
  description = "PostgreSQL 接続文字列"
  value       = "postgresql://${var.administrator_login}:${var.administrator_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.main.name}?sslmode=require"
  sensitive   = true
}

output "administrator_login" {
  description = "管理者ユーザー名"
  value       = azurerm_postgresql_flexible_server.main.administrator_login
}
