@description('Minimal Azure infrastructure for Code Racer - Ultra Basic Setup')

@minLength(1)
@maxLength(64)
param workloadName string

@minLength(1)
param location string

// Generate a unique suffix for resource names
var resourceToken = toLower(uniqueString(subscription().id, resourceGroup().name, location))
var tags = { 'azd-env-name': workloadName }

// Storage Account for static assets and file storage
module storage 'modules/storage-minimal.bicep' = {
  name: 'storage'
  params: {
    location: location
    tags: tags
    name: 'st${workloadName}${resourceToken}'
  }
}

// Outputs for deployment script
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_STORAGE_ACCOUNT_NAME string = storage.outputs.name
output AZURE_STORAGE_ACCOUNT_ENDPOINT string = storage.outputs.primaryEndpoints.blob 
