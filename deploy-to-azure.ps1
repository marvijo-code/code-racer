# Code Racer Azure Deployment Script
# This script deploys the Code Racer application to Microsoft Azure

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "East US 2",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "rg-coderacer-$Environment",
    
    [Parameter(Mandatory=$false)]
    [string]$PostgreSQLAdminPassword = $null,
    
    [Parameter(Mandatory=$false)]
    [string]$OpenAIApiKey = ""
)

# Color functions for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ️  $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

# Main deployment function
function Deploy-CodeRacer {
    Write-Info "Starting Code Racer deployment to Azure..."
    Write-Info "Environment: $Environment"
    Write-Info "Location: $Location"
    Write-Info "Resource Group: $ResourceGroupName"
    
    # Check if Azure CLI is installed
    try {
        $azVersion = az --version 2>$null
        Write-Success "Azure CLI is installed"
    }
    catch {
        Write-Error "Azure CLI is not installed. Please install Azure CLI first."
        Write-Info "Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        return
    }
    
    # Login to Azure
    Write-Info "Logging in to Azure..."
    try {
        az login --output table
        az account set --subscription $SubscriptionId
        Write-Success "Successfully logged in to Azure"
    }
    catch {
        Write-Error "Failed to login to Azure. Please check your credentials."
        return
    }
    
    # Generate secure password if not provided
    if (-not $PostgreSQLAdminPassword) {
        $PostgreSQLAdminPassword = -join ((65..90) + (97..122) + (48..57) + (33,35,36,37,38,42,43,45,46,47,58,59,61,63,64,91,93,95,126) | Get-Random -Count 16 | % {[char]$_})
        Write-Info "Generated secure PostgreSQL password"
    }
    
    # Create resource group
    Write-Info "Creating resource group: $ResourceGroupName"
    try {
        az group create --name $ResourceGroupName --location $Location --output table
        Write-Success "Resource group created successfully"
    }
    catch {
        Write-Error "Failed to create resource group"
        return
    }
    
    # Deploy infrastructure
    Write-Info "Deploying Azure infrastructure..."
    try {
        $deploymentResult = az deployment group create `
            --resource-group $ResourceGroupName `
            --template-file "azure-resources.bicep" `
            --parameters "azure-resources.parameters.json" `
            --parameters environment=$Environment `
            --parameters postgresqlAdminPassword=$PostgreSQLAdminPassword `
            --parameters openAiApiKey=$OpenAIApiKey `
            --output json | ConvertFrom-Json
        
        Write-Success "Infrastructure deployed successfully"
    }
    catch {
        Write-Error "Failed to deploy infrastructure"
        return
    }
    
    # Get deployment outputs
    $outputs = $deploymentResult.properties.outputs
    $backendUrl = $outputs.backendUrl.value
    $frontendUrl = $outputs.frontendUrl.value
    $postgresqlServerName = $outputs.postgresqlServerName.value
    $keyVaultName = $outputs.keyVaultName.value
    
    Write-Success "Deployment completed successfully!"
    Write-Info "Backend URL: $backendUrl"
    Write-Info "Frontend URL: $frontendUrl"
    Write-Info "PostgreSQL Server: $postgresqlServerName"
    Write-Info "Key Vault: $keyVaultName"
    
    # Create GitHub secrets file
    $secretsFile = "github-secrets.txt"
    @"
# GitHub Secrets for Code Racer Deployment
# Add these secrets to your GitHub repository settings

AZURE_CREDENTIALS={"clientId":"<service-principal-client-id>","clientSecret":"<service-principal-client-secret>","subscriptionId":"$SubscriptionId","tenantId":"<tenant-id>"}
AZURE_BACKEND_APP_NAME=coderacer-$Environment-backend
AZURE_BACKEND_URL=$backendUrl
AZURE_STATIC_WEB_APPS_API_TOKEN=<get-from-azure-portal>
AZURE_DATABASE_CONNECTION_STRING=Host=$postgresqlServerName.postgres.database.azure.com;Database=coderacer;Username=coderacer_admin;Password=$PostgreSQLAdminPassword;SSL Mode=Require;Trust Server Certificate=true
POSTGRESQL_ADMIN_PASSWORD=$PostgreSQLAdminPassword
OPENAI_API_KEY=$OpenAIApiKey
"@ | Out-File -FilePath $secretsFile -Encoding UTF8
    
    Write-Success "GitHub secrets saved to: $secretsFile"
    
    # Next steps
    Write-Info "Next steps:"
    Write-Info "1. Create a service principal for GitHub Actions:"
    Write-Info "   az ad sp create-for-rbac --name 'github-actions-coderacer' --role contributor --scopes /subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName --sdk-auth"
    Write-Info "2. Add the GitHub secrets from '$secretsFile' to your repository"
    Write-Info "3. Get the Static Web Apps API token from Azure Portal and add it to GitHub secrets"
    Write-Info "4. Push your code to trigger the deployment workflows"
    
    Write-Info "Database connection details:"
    Write-Info "Server: $postgresqlServerName.postgres.database.azure.com"
    Write-Info "Database: coderacer"
    Write-Info "Username: coderacer_admin"
    Write-Info "Password: $PostgreSQLAdminPassword"
    
    Write-Warning "IMPORTANT: Save the PostgreSQL password securely - it won't be displayed again!"
}

# Run the deployment
Deploy-CodeRacer 