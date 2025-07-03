@description('The name of the Redis cache')
param cacheName string

@description('The Azure region to deploy resources')
param location string

@description('The subnet ID for the Redis cache')
param subnetId string

@description('Resource tags')
param tags object = {}

@description('The SKU family')
param skuFamily string = 'P'

@description('The SKU name')
param skuName string = 'Premium'

@description('The SKU capacity')
param skuCapacity int = 1

// Redis Cache
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: cacheName
  location: location
  tags: tags
  properties: {
    sku: {
      name: skuName
      family: skuFamily
      capacity: skuCapacity
    }
    subnetId: subnetId
    staticIP: null
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
  }
}

// Outputs
output cacheId string = redisCache.id
output cacheName string = redisCache.name
output hostName string = redisCache.properties.hostName
output sslPort int = redisCache.properties.sslPort
output port int = redisCache.properties.port
output connectionString string = '${redisCache.properties.hostName}:${redisCache.properties.sslPort},password=${redisCache.listKeys().primaryKey},ssl=True,abortConnect=False' 
