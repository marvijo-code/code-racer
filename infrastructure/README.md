# Code Racer Infrastructure

This directory contains the Azure infrastructure deployment files for the Code Racer application using Bicep templates.

## Architecture Overview

The infrastructure includes:

- **AKS Cluster**: Kubernetes cluster with system and user node pools
- **PostgreSQL Flexible Server**: Primary database with private networking
- **Redis Cache**: Caching layer for session management
- **Container Registry**: For storing application container images
- **Application Gateway**: Load balancer and ingress controller
- **Key Vault**: Secure storage for secrets and connection strings
- **Log Analytics & Application Insights**: Monitoring and observability
- **Virtual Network**: Private networking with subnets and security groups
- **Storage Account**: For static assets and logs

## Prerequisites

1. **Azure CLI** - [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **PowerShell 7+** - [Install PowerShell](https://github.com/PowerShell/PowerShell)
3. **Azure Subscription** - Active Azure subscription with contributor access
4. **OpenAI API Key** - For question embeddings

## Quick Deployment

### 1. Login to Azure
```powershell
az login
```

### 2. Set your subscription (if you have multiple)
```powershell
az account set --subscription "Your Subscription Name"
```

### 3. Deploy infrastructure
```powershell
# Replace with your values
$resourceGroupName = "rg-coderacer-dev"
$postgresPassword = "YourSecurePassword123!"
$openAiApiKey = "sk-your-openai-api-key"

.\infrastructure\deploy.ps1 `
    -ResourceGroupName $resourceGroupName `
    -PostgresAdminPassword $postgresPassword `
    -OpenAiApiKey $openAiApiKey
```

### 4. What-If Deployment (Preview Changes)
```powershell
.\infrastructure\deploy.ps1 `
    -ResourceGroupName $resourceGroupName `
    -PostgresAdminPassword $postgresPassword `
    -OpenAiApiKey $openAiApiKey `
    -WhatIf
```

## Deployment Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `ResourceGroupName` | Azure resource group name | - | ✅ |
| `Location` | Azure region | "East US" | ❌ |
| `Environment` | Environment name (dev/staging/prod) | "dev" | ❌ |
| `AppName` | Application name | "coderacer" | ❌ |
| `PostgresAdminPassword` | PostgreSQL admin password | - | ✅ |
| `OpenAiApiKey` | OpenAI API key for embeddings | - | ✅ |

## Resource Naming Convention

Resources are named using the pattern: `{appName}-{environment}-{resourceType}`

Examples:
- AKS Cluster: `coderacer-dev-aks`
- PostgreSQL: `coderacer-dev-postgres`
- Container Registry: `coderacerdevacr`
- Key Vault: `coderacer-dev-kv`

## Estimated Costs

**Development Environment (East US):**
- AKS Cluster (2 system + 3 user nodes): ~$200/month
- PostgreSQL Flexible Server (Standard_D2s_v3): ~$120/month
- Redis Cache (Premium P1): ~$250/month
- Container Registry (Basic): ~$5/month
- Application Gateway (Standard_v2): ~$20/month
- Storage Account: ~$5/month
- **Total: ~$600/month**

## Post-Deployment Steps

### 1. Connect to AKS Cluster
```powershell
az aks get-credentials --resource-group $resourceGroupName --name coderacer-dev-aks
kubectl get nodes
```

### 2. Get Container Registry Credentials
```powershell
$acrName = "coderacerdevacr"
az acr login --name $acrName
$loginServer = az acr show --name $acrName --query loginServer --output tsv
Write-Host "ACR Login Server: $loginServer"
```

### 3. View Deployment Outputs
Check the generated `infrastructure/deployment-outputs.json` file for all resource details.

### 4. Configure Application
Update your application configuration with the deployed resource details:
- Database connection string (from Key Vault)
- Redis connection string (from Key Vault)
- Application Insights connection string
- Container registry URL

## Troubleshooting

### Common Issues

1. **Deployment Timeout**
   - AKS and PostgreSQL can take 15-20 minutes to deploy
   - Check Azure portal for detailed deployment status

2. **Resource Name Conflicts**
   - Container Registry names must be globally unique
   - Modify the `appName` parameter if conflicts occur

3. **Permission Issues**
   - Ensure you have Contributor access to the subscription
   - Some resources require additional permissions (e.g., Key Vault access policies)

4. **Quota Limits**
   - Check your subscription quotas for VM cores
   - AKS requires sufficient compute quota in the selected region

### Viewing Deployment Logs
```powershell
# Get deployment status
az deployment group show --resource-group $resourceGroupName --name "coderacer-deployment-YYYYMMDD-HHMMSS"

# List all deployments
az deployment group list --resource-group $resourceGroupName --output table
```

## Cleanup

To delete all resources:
```powershell
az group delete --name $resourceGroupName --yes --no-wait
```

**⚠️ Warning**: This will permanently delete all resources in the resource group.

## Security Considerations

- PostgreSQL is deployed with private networking only
- Redis Cache is configured for private access
- Key Vault stores all sensitive configuration
- Network Security Groups restrict traffic between subnets
- Application Gateway provides SSL termination
- Container Registry has admin access enabled for development

## Next Steps

After successful deployment:
1. Build and push container images to ACR
2. Deploy Kubernetes manifests
3. Configure DNS and SSL certificates
4. Set up CI/CD pipelines
5. Configure monitoring and alerting

## Support

For issues with the infrastructure deployment:
1. Check the Azure portal for detailed error messages
2. Review the deployment logs using Azure CLI
3. Verify all prerequisites are met
4. Ensure sufficient permissions and quotas 