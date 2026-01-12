output "id" {
  description = "Static Web App ID"
  value       = azurerm_static_web_app.main.id
}

output "default_host_name" {
  description = "デフォルトホスト名"
  value       = azurerm_static_web_app.main.default_host_name
}

output "api_key" {
  description = "デプロイ用 API キー"
  value       = azurerm_static_web_app.main.api_key
  sensitive   = true
}
