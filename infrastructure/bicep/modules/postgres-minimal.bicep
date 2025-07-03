@description('The name of the PostgreSQL server')
param serverName string

@description('The Azure region to deploy resources')
param location string

@description('The administrator username')
param administratorLogin string

@description('The administrator password')
@secure()
param administratorPassword string

@description('The subnet ID for the PostgreSQL server')
param subnetId string

@description('The private DNS zone ID')
param privateDnsZoneId string

@description('Resource tags')
param tags object = {}

// PostgreSQL Flexible Server (Burstable - cheapest option)
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: serverName
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    storage: {
      storageSizeGB: 32
      autoGrow: 'Disabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    network: {
      delegatedSubnetResourceId: subnetId
      privateDnsZoneArmResourceId: privateDnsZoneId
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// Database for Code Racer
resource coderacerDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgresServer
  name: 'coderacer'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Outputs
output serverId string = postgresServer.id
output serverName string = postgresServer.name
output serverFqdn string = postgresServer.properties.fullyQualifiedDomainName
output databaseName string = coderacerDatabase.name 
