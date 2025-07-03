# Code Racer Azure Deployment Guide

This guide will help you deploy the Code Racer application to Microsoft Azure using Azure Static Web Apps for the frontend and Azure App Service for the backend.

## Architecture Overview

The deployment includes:
- **Frontend**: React app deployed to Azure Static Web Apps
- **Backend**: ASP.NET Core API deployed to Azure App Service
- **Database**: Azure Database for PostgreSQL
- **Key Vault**: For storing secrets securely
- **Application Insights**: For monitoring and logging

## Prerequisites

Before deploying, ensure you have:

1. **Azure Account**: [Create a free account](https://azure.microsoft.com/free/) if you don't have one
2. **Azure CLI**: [Install Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
3. **GitHub Repository**: Your code should be in a GitHub repository
4. **PowerShell**: For running the deployment script (Windows/macOS/Linux)

## Quick Deployment

### Option 1: Using PowerShell Script (Recommended)

1. **Clone the repository** and navigate to the project folder:
   ```powershell
   git clone https://github.com/your-username/code-racer.git
   cd code-racer
   ```

2. **Run the deployment script**:
   ```powershell
   .\deploy-to-azure.ps1 -SubscriptionId "your-subscription-id"
   ```

   Optional parameters:
   ```powershell
   .\deploy-to-azure.ps1 -SubscriptionId "your-subscription-id" -Environment "prod" -Location "West US 2" -OpenAIApiKey "your-openai-key"
   ```

3. **Follow the post-deployment steps** printed by the script.

### Option 2: Manual Azure CLI Deployment

1. **Login to Azure**:
   ```bash
   az login
   az account set --subscription "your-subscription-id"
   ```

2. **Create resource group**:
   ```bash
   az group create --name "rg-coderacer-dev" --location "East US 2"
   ```

3. **Deploy infrastructure**:
   ```bash
   az deployment group create \
     --resource-group "rg-coderacer-dev" \
     --template-file "azure-resources.bicep" \
     --parameters "azure-resources.parameters.json" \
     --parameters environment="dev" \
     --parameters postgresqlAdminPassword="YourSecurePassword123!" \
     --parameters openAiApiKey="your-openai-key"
   ```

## Configuration

### 1. Update Parameters

Edit `azure-resources.parameters.json` to customize your deployment:

```json
{
  "parameters": {
    "appName": {
      "value": "coderacer"
    },
    "location": {
      "value": "East US 2"
    },
    "environment": {
      "value": "dev"
    },
    "postgresqlAdminPassword": {
      "value": "YourSecurePassword123!"
    },
    "openAiApiKey": {
      "value": "your-openai-api-key"
    }
  }
}
```

### 2. GitHub Actions Setup

#### A. Create Service Principal

Create a service principal for GitHub Actions:

```bash
az ad sp create-for-rbac --name "github-actions-coderacer" --role contributor --scopes /subscriptions/your-subscription-id/resourceGroups/rg-coderacer-dev --sdk-auth
```

#### B. Add GitHub Secrets

Add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions):

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AZURE_CREDENTIALS` | Service principal credentials | `{"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}` |
| `AZURE_BACKEND_APP_NAME` | Backend app service name | `coderacer-dev-backend` |
| `AZURE_BACKEND_URL` | Backend URL | `https://coderacer-dev-backend.azurewebsites.net` |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Static Web Apps deployment token | Get from Azure Portal |
| `AZURE_DATABASE_CONNECTION_STRING` | PostgreSQL connection string | `Host=coderacer-dev-postgres.postgres.database.azure.com;Database=coderacer;Username=coderacer_admin;Password=...;SSL Mode=Require;Trust Server Certificate=true` |
| `POSTGRESQL_ADMIN_PASSWORD` | PostgreSQL admin password | `YourSecurePassword123!` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-...` |

#### C. Get Static Web Apps API Token

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Static Web App resource
3. Go to **Overview** > **Manage deployment token**
4. Copy the deployment token and add it to GitHub secrets as `AZURE_STATIC_WEB_APPS_API_TOKEN`

## Database Setup

### 1. Run Migrations

After deployment, run database migrations:

```bash
# From the Backend directory
cd Backend
dotnet ef database update --connection "Host=your-postgres-server.postgres.database.azure.com;Database=coderacer;Username=coderacer_admin;Password=YourPassword;SSL Mode=Require;Trust Server Certificate=true"
```

### 2. Seed Data (Optional)

If you have seed data, run:

```bash
dotnet run --seed-data
```

## Environment Variables

### Frontend Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=https://coderacer-dev-backend.azurewebsites.net
```

### Backend Environment Variables

The backend uses these environment variables (automatically configured in Azure):

- `ConnectionStrings__DefaultConnection`: PostgreSQL connection string
- `OpenAI__ApiKey`: OpenAI API key
- `ASPNETCORE_ENVIRONMENT`: Environment (Development/Production)

## Monitoring and Logging

### Application Insights

The deployment includes Application Insights for monitoring:

1. **View metrics** in Azure Portal > Application Insights
2. **Set up alerts** for performance issues
3. **Monitor logs** and exceptions

### Log Analytics

Query logs using KQL in Azure Portal:

```kusto
traces
| where timestamp >= ago(1h)
| where severityLevel >= 2
| order by timestamp desc
```

## Scaling and Performance

### Auto-scaling

Configure auto-scaling for the App Service:

```bash
az monitor autoscale create \
  --resource-group "rg-coderacer-dev" \
  --resource "coderacer-dev-backend" \
  --resource-type Microsoft.Web/sites \
  --name "coderacer-autoscale" \
  --min-count 1 \
  --max-count 3 \
  --count 1
```

### Database Scaling

Scale the PostgreSQL database:

```bash
az postgres flexible-server update \
  --resource-group "rg-coderacer-dev" \
  --name "coderacer-dev-postgres" \
  --sku-name Standard_B2s
```

## Security Best Practices

### 1. Network Security

- Enable private endpoints for PostgreSQL
- Use Azure Key Vault for secrets
- Configure firewall rules

### 2. Identity and Access

- Use Managed Identity for resource access
- Implement proper CORS policies
- Enable HTTPS only

### 3. Data Protection

- Enable backup for PostgreSQL
- Use SSL/TLS for all connections
- Implement proper authentication

## Troubleshooting

### Common Issues

1. **Build failures**: Check GitHub Actions logs
2. **Database connection**: Verify firewall rules and connection strings
3. **CORS errors**: Update allowed origins in backend configuration
4. **Static Web App deployment**: Check deployment token and build configuration

### Debugging Steps

1. **Check Application Insights** for backend errors
2. **Review GitHub Actions logs** for deployment issues
3. **Verify resource configuration** in Azure Portal
4. **Test API endpoints** directly

## Cost Management

### Estimated Monthly Costs (USD)

- **App Service (B1)**: ~$13
- **PostgreSQL (B1ms)**: ~$12
- **Static Web Apps (Free)**: $0
- **Key Vault (Standard)**: ~$3
- **Application Insights**: Usage-based
- **Total**: ~$28-35/month

### Cost Optimization Tips

1. Use **Azure Cost Management** to monitor spending
2. **Scale down** resources for development environments
3. **Use slots** for staging deployments
4. **Enable auto-shutdown** for non-production resources

## Cleanup

To remove all resources:

```bash
az group delete --name "rg-coderacer-dev" --yes --no-wait
```

## Support

For issues and questions:

1. Check the [GitHub Issues](https://github.com/your-username/code-racer/issues)
2. Review Azure documentation
3. Contact Azure Support if needed

## Next Steps

After successful deployment:

1. **Configure custom domain** for production
2. **Set up SSL certificates**
3. **Configure CD/CI pipelines**
4. **Implement monitoring alerts**
5. **Set up backup strategies**

---

## Deployment Checklist

- [ ] Azure account and subscription ready
- [ ] Azure CLI installed and configured
- [ ] GitHub repository set up
- [ ] Service principal created
- [ ] GitHub secrets configured
- [ ] Infrastructure deployed
- [ ] Database migrations run
- [ ] Applications deployed and tested
- [ ] Monitoring configured
- [ ] Custom domain configured (if needed)

Happy deploying! 🚀 