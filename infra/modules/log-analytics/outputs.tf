output "id" {
  description = "Log Analytics Workspace ID"
  value       = azurerm_log_analytics_workspace.main.id
}

output "workspace_id" {
  description = "Log Analytics Workspace ID (GUID)"
  value       = azurerm_log_analytics_workspace.main.workspace_id
}

output "primary_shared_key" {
  description = "プライマリ共有キー"
  value       = azurerm_log_analytics_workspace.main.primary_shared_key
  sensitive   = true
}
