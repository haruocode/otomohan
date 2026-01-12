output "resource_group_name" {
  description = "リソースグループ名"
  value       = module.resource_group.name
}

output "frontend_url" {
  description = "フロントエンド URL"
  value       = "https://${module.static_web_app.default_host_name}"
}

output "frontend_api_key" {
  description = "Static Web App デプロイ用 API キー"
  value       = module.static_web_app.api_key
  sensitive   = true
}

output "backend_url" {
  description = "バックエンド API URL"
  value       = module.container_apps.url
}

output "postgresql_fqdn" {
  description = "PostgreSQL サーバー FQDN"
  value       = module.postgresql.fqdn
}

output "postgresql_connection_string" {
  description = "PostgreSQL 接続文字列"
  value       = module.postgresql.connection_string
  sensitive   = true
}

output "acs_connection_string" {
  description = "ACS 接続文字列"
  value       = module.communication_services.primary_connection_string
  sensitive   = true
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = module.key_vault.vault_uri
}
