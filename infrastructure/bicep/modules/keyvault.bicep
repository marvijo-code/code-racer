@description('The name of the Key Vault')
param vaultName string

@description('The Azure region to deploy resources')
param location string

@description('The object ID to grant access to')
param objectId string

@description('Resource tags')
param tags object = {}

@description('Array of secrets to create')
param secrets array = []

@description('The SKU of the Key Vault')
param skuName string = 'standard'

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: skuName
    }
    tenantId: tenant().tenantId
    enabledForDeployment: false
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    enableRbacAuthorization: false
    accessPolicies: [
      {
        tenantId: tenant().tenantId
        objectId: objectId
        permissions: {
          secrets: [
            'get'
            'list'
            'set'
            'delete'
          ]
          keys: [
            'get'
            'list'
            'create'
            'delete'
            'update'
          ]
          certificates: [
            'get'
            'list'
            'create'
            'delete'
            'update'
          ]
        }
      }
    ]
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Create secrets
resource keyVaultSecrets 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = [for secret in secrets: {
  parent: keyVault
  name: secret.name
  properties: {
    value: secret.value
    contentType: 'text/plain'
  }
}]

// Outputs
output vaultId string = keyVault.id
output vaultName string = keyVault.name
output vaultUri string = keyVault.properties.vaultUri 
