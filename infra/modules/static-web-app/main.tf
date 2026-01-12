# Static Web App Module (Frontend SPA)

resource "azurerm_static_web_app" "main" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku_tier            = var.sku_tier
  sku_size            = var.sku_size
  tags                = var.tags
}

# カスタムドメイン設定（オプション）
resource "azurerm_static_web_app_custom_domain" "main" {
  count = var.custom_domain != null ? 1 : 0

  static_web_app_id = azurerm_static_web_app.main.id
  domain_name       = var.custom_domain
  validation_type   = "cname-delegation"
}
