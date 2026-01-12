# Container Apps Module (Backend API + WebSocket)

# Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                       = var.environment_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
  tags                       = var.tags
}

# Container App (Fastify Backend)
resource "azurerm_container_app" "main" {
  name                         = var.app_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"
  tags                         = var.tags

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = "backend"
      image  = var.container_image
      cpu    = var.cpu
      memory = var.memory

      # 環境変数
      dynamic "env" {
        for_each = var.environment_variables
        content {
          name  = env.key
          value = env.value
        }
      }

      # シークレット参照の環境変数
      dynamic "env" {
        for_each = var.secret_environment_variables
        content {
          name        = env.key
          secret_name = env.value
        }
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = var.target_port
    transport        = "auto" # HTTP/WebSocket 両対応

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }

    # CORS 設定
    dynamic "cors" {
      for_each = var.cors_allowed_origins != null ? [1] : []
      content {
        allowed_origins = var.cors_allowed_origins
        allowed_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        allowed_headers = ["*"]
      }
    }
  }

  # シークレット定義
  dynamic "secret" {
    for_each = var.secrets
    content {
      name  = secret.key
      value = secret.value
    }
  }

  identity {
    type = "SystemAssigned"
  }
}
