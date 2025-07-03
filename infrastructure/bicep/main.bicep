@description('The name of the application')
param appName string = 'coderacer'

@description('The environment name (dev, staging, prod)')
param environment string = 'dev'

@description('The Azure region to deploy resources')
param location string = resourceGroup().location

@description('The administrator username for PostgreSQL')
param postgresAdminUsername string = 'coderacer_admin'

@description('The administrator password for PostgreSQL')
@secure()
param postgresAdminPassword string

@description('The OpenAI API key for embeddings')
@secure()
param openAiApiKey string

@description('The container registry login server')
param containerRegistryLoginServer string = ''

@description('The container registry username')
param containerRegistryUsername string = ''

@description('The container registry password')
@secure()
param containerRegistryPassword string = ''

// Variables
var resourcePrefix = '${appName}-${environment}'
var tags = {
  Application: appName
  Environment: environment
  ManagedBy: 'Bicep'
}

// Virtual Network
module vnet 'modules/networking.bicep' = {
  name: 'vnet-deployment'
  params: {
    vnetName: '${resourcePrefix}-vnet'
    location: location
    tags: tags
  }
}

// Log Analytics Workspace
module logAnalytics 'modules/monitoring.bicep' = {
  name: 'monitoring-deployment'
  params: {
    workspaceName: '${resourcePrefix}-logs'
    appInsightsName: '${resourcePrefix}-appinsights'
    location: location
    tags: tags
  }
}

// Container Registry
module containerRegistry 'modules/container-registry.bicep' = {
  name: 'acr-deployment'
  params: {
    registryName: '${replace(resourcePrefix, '-', '')}acr'
    location: location
    tags: tags
  }
}

// PostgreSQL Flexible Server
module postgres 'modules/postgres.bicep' = {
  name: 'postgres-deployment'
  params: {
    serverName: '${resourcePrefix}-postgres'
    location: location
    administratorLogin: postgresAdminUsername
    administratorPassword: postgresAdminPassword
    subnetId: vnet.outputs.postgresSubnetId
    privateDnsZoneId: vnet.outputs.postgresPrivateDnsZoneId
    tags: tags
  }
}

// Redis Cache
module redis 'modules/redis.bicep' = {
  name: 'redis-deployment'
  params: {
    cacheName: '${resourcePrefix}-redis'
    location: location
    subnetId: vnet.outputs.redisSubnetId
    tags: tags
  }
}

// Storage Account
module storage 'modules/storage.bicep' = {
  name: 'storage-deployment'
  params: {
    storageAccountName: '${replace(resourcePrefix, '-', '')}storage'
    location: location
    tags: tags
  }
}

// AKS Cluster
module aks 'modules/aks.bicep' = {
  name: 'aks-deployment'
  params: {
    clusterName: '${resourcePrefix}-aks'
    location: location
    subnetId: vnet.outputs.aksSubnetId
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
    containerRegistryId: containerRegistry.outputs.registryId
    tags: tags
  }
}

// Key Vault
module keyVault 'modules/keyvault.bicep' = {
  name: 'keyvault-deployment'
  params: {
    vaultName: '${resourcePrefix}-kv'
    location: location
    objectId: aks.outputs.principalId
    tags: tags
    secrets: [
      {
        name: 'postgres-connection-string'
        value: 'Host=${postgres.outputs.serverFqdn};Database=coderacer;Username=${postgresAdminUsername};Password=${postgresAdminPassword};SSL Mode=Require;'
      }
      {
        name: 'redis-connection-string'
        value: redis.outputs.connectionString
      }
      {
        name: 'openai-api-key'
        value: openAiApiKey
      }
      {
        name: 'storage-connection-string'
        value: storage.outputs.connectionString
      }
    ]
  }
}

// Application Gateway (for ingress)
module appGateway 'modules/app-gateway.bicep' = {
  name: 'appgateway-deployment'
  params: {
    appGatewayName: '${resourcePrefix}-appgw'
    location: location
    subnetId: vnet.outputs.appGatewaySubnetId
    publicIpId: vnet.outputs.publicIpId
    tags: tags
  }
}

// Outputs
output resourceGroupName string = resourceGroup().name
output aksClusterName string = aks.outputs.clusterName
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
output postgresServerFqdn string = postgres.outputs.serverFqdn
output redisHostName string = redis.outputs.hostName
output storageAccountName string = storage.outputs.storageAccountName
output keyVaultName string = keyVault.outputs.vaultName
output appInsightsInstrumentationKey string = logAnalytics.outputs.instrumentationKey
output appInsightsConnectionString string = logAnalytics.outputs.connectionString
output publicIpAddress string = vnet.outputs.publicIpAddress 
