# Azure Key Vault Module

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                        = var.name
  location                    = var.location
  resource_group_name         = var.resource_group_name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = var.sku_name
  soft_delete_retention_days  = var.soft_delete_retention_days
  purge_protection_enabled    = var.purge_protection_enabled
  enable_rbac_authorization   = var.enable_rbac_authorization
  tags                        = var.tags

  # Terraform 実行ユーザーにアクセス権を付与（RBAC 無効時のみ）
  dynamic "access_policy" {
    for_each = var.enable_rbac_authorization ? [] : [1]
    content {
      tenant_id = data.azurerm_client_config.current.tenant_id
      object_id = data.azurerm_client_config.current.object_id

      secret_permissions = [
        "Get",
        "List",
        "Set",
        "Delete",
        "Purge",
        "Recover"
      ]
    }
  }
}

# シークレットを Key Vault に保存
resource "azurerm_key_vault_secret" "secrets" {
  for_each     = var.secrets
  name         = each.key
  value        = each.value
  key_vault_id = azurerm_key_vault.main.id
}

# Container Apps のマネージド ID にアクセス権を付与
resource "azurerm_key_vault_access_policy" "container_app" {
  count        = var.container_app_principal_id != null && !var.enable_rbac_authorization ? 1 : 0
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = var.container_app_principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}
