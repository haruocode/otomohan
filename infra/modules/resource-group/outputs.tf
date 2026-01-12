output "name" {
  description = "リソースグループ名"
  value       = azurerm_resource_group.main.name
}

output "location" {
  description = "リソースグループのリージョン"
  value       = azurerm_resource_group.main.location
}

output "id" {
  description = "リソースグループID"
  value       = azurerm_resource_group.main.id
}
