# otomohan Dev 環境
# Terraform で Azure インフラをプロビジョニング

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

provider "random" {}

locals {
  project     = "otomohan"
  environment = "dev"
  location    = "japaneast"

  tags = {
    project     = local.project
    environment = local.environment
    managed_by  = "terraform"
  }
}

# ランダムサフィックス（グローバルで一意な名前用）
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# =============================================================================
# Resource Group
# =============================================================================
module "resource_group" {
  source = "../../modules/resource-group"

  name     = "rg-${local.project}-${local.environment}"
  location = local.location
  tags     = local.tags
}

# =============================================================================
# Log Analytics (Container Apps に必要)
# =============================================================================
module "log_analytics" {
  source = "../../modules/log-analytics"

  name                = "log-${local.project}-${local.environment}"
  location            = module.resource_group.location
  resource_group_name = module.resource_group.name
  retention_in_days   = 30
  tags                = local.tags
}

# =============================================================================
# Azure Communication Services
# =============================================================================
module "communication_services" {
  source = "../../modules/communication-services"

  name                = "acs-${local.project}-${local.environment}"
  resource_group_name = module.resource_group.name
  data_location       = "Japan"
  tags                = local.tags
}

# =============================================================================
# PostgreSQL Flexible Server
# =============================================================================
module "postgresql" {
  source = "../../modules/postgresql"

  name                   = "psql-${local.project}-${local.environment}"
  location               = module.resource_group.location
  resource_group_name    = module.resource_group.name
  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password
  database_name          = local.project
  sku_name               = "B_Standard_B1ms" # 開発向け最小構成
  storage_mb             = 32768
  allow_azure_services   = true
  tags                   = local.tags
}

# =============================================================================
# Container Apps (Backend API + WebSocket)
# =============================================================================
module "container_apps" {
  source = "../../modules/container-apps"

  environment_name           = "cae-${local.project}-${local.environment}"
  app_name                   = "ca-${local.project}-api-${local.environment}"
  location                   = module.resource_group.location
  resource_group_name        = module.resource_group.name
  log_analytics_workspace_id = module.log_analytics.id
  container_image            = var.backend_image
  target_port                = 5051
  cpu                        = 0.5
  memory                     = "1Gi"
  min_replicas               = 0
  max_replicas               = 2

  environment_variables = {
    NODE_ENV        = "development"
    PORT            = "5051"
    TERMS_URL       = "https://otmhn.app/terms"
    PRIVACY_URL     = "https://otmhn.app/privacy"
    APP_VERSION     = var.app_version
    MIN_APP_VERSION = var.min_app_version
  }

  secret_environment_variables = {
    DATABASE_URL          = "database-url"
    ACS_CONNECTION_STRING = "acs-connection-string"
  }

  secrets = {
    "database-url"          = module.postgresql.connection_string
    "acs-connection-string" = module.communication_services.primary_connection_string
  }

  cors_allowed_origins = ["*"] # 開発環境は全許可
  tags                 = local.tags
}

# =============================================================================
# Static Web App (Frontend SPA)
# =============================================================================
module "static_web_app" {
  source = "../../modules/static-web-app"

  name                = "stapp-${local.project}-${local.environment}"
  location            = "eastasia" # Static Web App は eastasia 推奨
  resource_group_name = module.resource_group.name
  sku_tier            = "Free"
  sku_size            = "Free"
  tags                = local.tags
}

# =============================================================================
# Key Vault (シークレット管理)
# =============================================================================
module "key_vault" {
  source = "../../modules/key-vault"

  name                       = "kv-${local.project}-${local.environment}-${random_string.suffix.result}"
  location                   = module.resource_group.location
  resource_group_name        = module.resource_group.name
  container_app_principal_id = module.container_apps.identity_principal_id

  secrets = {
    "database-url"          = module.postgresql.connection_string
    "acs-connection-string" = module.communication_services.primary_connection_string
  }

  tags = local.tags
}
