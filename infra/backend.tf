# Terraform 状態ファイルを Azure Storage に保存する設定
# 初回は以下をコメントアウトして local backend で実行し、
# Storage Account 作成後にコメントを外して terraform init -migrate-state を実行

# terraform {
#   backend "azurerm" {
#     resource_group_name  = "rg-otomohan-tfstate"
#     storage_account_name = "stotomohanterraform"
#     container_name       = "tfstate"
#     key                  = "terraform.tfstate"
#   }
# }
