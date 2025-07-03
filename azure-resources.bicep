@description('The name of the application')
param appName string = 'coderacer'

@description('The location for all resources')
param location string = resourceGroup().location

@description('The environment (dev, staging, prod)')
param environment string = 'dev'

@description('The SKU for the App Service Plan')
param appServicePlanSku string = 'B1'

@description('The SKU for the PostgreSQL server')
param postgresqlSku string = 'Standard_B1ms'

@description('The administrator username for PostgreSQL')
param postgresqlAdminUsername string = 'coderacer_admin'

@description('The administrator password for PostgreSQL')
@secure()
param postgresqlAdminPassword string

@description('The OpenAI API key')
@secure()
param openAiApiKey string = ''

var resourcePrefix = '${appName}-${environment}'
var databaseName = 'coderacer'

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${resourcePrefix}-asp'
  location: location
  sku: {
    name: appServicePlanSku
  }
  properties: {
    reserved: true // Linux
  }
}

// App Service for Backend API
resource backendAppService 'Microsoft.Web/sites@2023-12-01' = {
  name: '${resourcePrefix}-backend'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|9.0'
      appSettings: [
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: environment == 'prod' ? 'Production' : 'Development'
        }
        {
          name: 'ConnectionStrings__DefaultConnection'
          value: 'Host=${postgresqlServer.properties.fullyQualifiedDomainName};Database=${databaseName};Username=${postgresqlAdminUsername};Password=${postgresqlAdminPassword};SSL Mode=Require;Trust Server Certificate=true'
        }
        {
          name: 'OpenAI__ApiKey'
          value: openAiApiKey
        }
        {
          name: 'AllowedHosts'
          value: '*'
        }
        {
          name: 'WEBSITES_PORT'
          value: '8080'
        }
      ]
      cors: {
        allowedOrigins: [
          'https://${staticWebApp.properties.defaultHostname}'
          'https://localhost:3113'
          'http://localhost:3113'
        ]
        supportCredentials: true
      }
    }
  }
}

// PostgreSQL Flexible Server
resource postgresqlServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: '${resourcePrefix}-postgres'
  location: location
  sku: {
    name: postgresqlSku
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: postgresqlAdminUsername
    administratorLoginPassword: postgresqlAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    version: '16'
  }
}

// PostgreSQL Database
resource postgresqlDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  name: databaseName
  parent: postgresqlServer
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

// PostgreSQL Firewall Rule to allow Azure services
resource postgresqlFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  name: 'AllowAzureServices'
  parent: postgresqlServer
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Static Web App for Frontend
resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: '${resourcePrefix}-frontend'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      appLocation: '/frontend'
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${resourcePrefix}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'rest'
  }
}

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${resourcePrefix}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Secrets are stored directly in App Service configuration
// This is secure and eliminates the need for Key Vault

// Outputs
output backendUrl string = 'https://${backendAppService.properties.defaultHostname}'
output frontendUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output postgresqlServerName string = postgresqlServer.name
output postgresqlDatabaseName string = databaseName
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey 