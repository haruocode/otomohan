# Log Analytics Workspace Module
# Container Apps Environment に必要

resource "azurerm_log_analytics_workspace" "main" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.sku
  retention_in_days   = var.retention_in_days
  tags                = var.tags
}
