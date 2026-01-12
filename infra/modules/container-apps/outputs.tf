output "environment_id" {
  description = "Container Apps Environment ID"
  value       = azurerm_container_app_environment.main.id
}

output "app_id" {
  description = "Container App ID"
  value       = azurerm_container_app.main.id
}

output "fqdn" {
  description = "Container App の FQDN"
  value       = azurerm_container_app.main.ingress[0].fqdn
}

output "url" {
  description = "Container App の URL"
  value       = "https://${azurerm_container_app.main.ingress[0].fqdn}"
}

output "identity_principal_id" {
  description = "マネージド ID のプリンシパル ID"
  value       = azurerm_container_app.main.identity[0].principal_id
}
