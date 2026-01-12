# otomohan Production 環境
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

  # 本番環境は Azure Storage Backend を使用
  # backend "azurerm" {
  #   resource_group_name  = "rg-otomohan-tfstate"
  #   storage_account_name = "stotomohanterraform"
  #   container_name       = "tfstate"
  #   key                  = "prod.terraform.tfstate"
  # }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false # 本番では無効
      recover_soft_deleted_key_vaults = true
    }
  }
}

provider "random" {}

locals {
  project     = "otomohan"
  environment = "prod"
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
  retention_in_days   = 90 # 本番は長めに保持
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
# PostgreSQL Flexible Server (本番構成)
# =============================================================================
module "postgresql" {
  source = "../../modules/postgresql"

  name                         = "psql-${local.project}-${local.environment}"
  location                     = module.resource_group.location
  resource_group_name          = module.resource_group.name
  administrator_login          = var.db_admin_username
  administrator_password       = var.db_admin_password
  database_name                = local.project
  sku_name                     = "GP_Standard_D2s_v3" # 本番向け
  storage_mb                   = 65536                # 64GB
  backup_retention_days        = 30
  geo_redundant_backup_enabled = true
  high_availability_enabled    = true
  allow_azure_services         = true
  tags                         = local.tags
}

# =============================================================================
# Container Apps (Backend API + WebSocket) - 本番構成
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
  cpu                        = 1.0
  memory                     = "2Gi"
  min_replicas               = 1 # 本番は常時起動
  max_replicas               = 5

  environment_variables = {
    NODE_ENV        = "production"
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

  cors_allowed_origins = var.cors_allowed_origins
  tags                 = local.tags
}

# =============================================================================
# Static Web App (Frontend SPA) - 本番構成
# =============================================================================
module "static_web_app" {
  source = "../../modules/static-web-app"

  name                = "stapp-${local.project}-${local.environment}"
  location            = "eastasia"
  resource_group_name = module.resource_group.name
  sku_tier            = "Standard" # 本番は Standard
  sku_size            = "Standard"
  custom_domain       = var.custom_domain
  tags                = local.tags
}

# =============================================================================
# Key Vault (シークレット管理) - 本番構成
# =============================================================================
module "key_vault" {
  source = "../../modules/key-vault"

  name                       = "kv-${local.project}-prd-${random_string.suffix.result}"
  location                   = module.resource_group.location
  resource_group_name        = module.resource_group.name
  purge_protection_enabled   = true # 本番は有効
  soft_delete_retention_days = 90
  container_app_principal_id = module.container_apps.identity_principal_id

  secrets = {
    "database-url"          = module.postgresql.connection_string
    "acs-connection-string" = module.communication_services.primary_connection_string
  }

  tags = local.tags
}
