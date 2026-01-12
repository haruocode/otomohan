output "id" {
  description = "ACS リソース ID"
  value       = azurerm_communication_service.main.id
}

output "name" {
  description = "ACS リソース名"
  value       = azurerm_communication_service.main.name
}

output "primary_connection_string" {
  description = "ACS プライマリ接続文字列"
  value       = azurerm_communication_service.main.primary_connection_string
  sensitive   = true
}

output "secondary_connection_string" {
  description = "ACS セカンダリ接続文字列"
  value       = azurerm_communication_service.main.secondary_connection_string
  sensitive   = true
}

output "primary_key" {
  description = "ACS プライマリキー"
  value       = azurerm_communication_service.main.primary_key
  sensitive   = true
}
