# Azure Log Analytics Workspace Data Purge Guide

This guide provides step-by-step instructions for clearing all data from an Azure Log Analytics workspace using the Azure CLI and REST API.

## Prerequisites

1. **Azure CLI installed** - Version 2.57.0 or later
2. **Authenticated to Azure** - Logged in with appropriate permissions
3. **Data Purger role** - Assign yourself this role temporarily (highly privileged)
4. **PowerShell** - For running the automation scripts

## Important Warnings

⚠️ **CRITICAL**: Data purging is **PERMANENT** and **IRREVERSIBLE**
- Purged data cannot be recovered
- Operations can take several hours or days to complete
- Rate limited to 50 requests per hour
- Only use for compliance requirements (GDPR, etc.)

## Authentication Setup

```powershell
# Check Azure CLI version
az --version

# Login to Azure
az login

# Verify account and subscription
az account show

# Set subscription if needed
az account set --subscription "your-subscription-id"
```

## Method 1: Single Table Purge

### Basic Purge Request

```powershell
# Create JSON body for purge request
$jsonBody = @{
    table = "TableName"
    filters = @(
        @{
            column = "TimeGenerated"
            operator = ">"
            value = "1900-01-01T00:00:00Z"
        }
    )
} | ConvertTo-Json -Depth 3

# Save to file
$jsonBody | Out-File -FilePath "purge-body.json" -Encoding utf8

# Execute purge request
az rest --method post --uri "https://management.azure.com/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.OperationalInsights/workspaces/{workspace-name}/purge?api-version=2023-09-01" --body @purge-body.json
```

### Example Response
```json
{
  "operationId": "purge-5861dc24-a9fe-48c7-a09b-749f756e77a2"
}
```

## Method 2: Bulk Table Purge Script

### PowerShell Script for Multiple Tables

```powershell
# Define tables to purge
$tables = @(
    "AzureActivity", "AzureMetrics", "AzureMetricsV2", "Heartbeat", "Perf", "Syslog",
    "Usage", "Operation", "Alert", "Event", "InsightsMetrics", "AuditLogs",
    "ContainerInstanceLog", "ContainerEvent", "ContainerLogV2", 
    "StorageBlobLogs", "StorageFileLogs", "StorageQueueLogs", "StorageTableLogs",
    "AKSAudit", "AKSAuditAdmin", "AKSControlPlane", "LAQueryLogs", 
    "AppServiceHTTPLogs", "AppServiceConsoleLogs", "AppServiceAppLogs", 
    "AppServiceAuditLogs", "AppServiceFileAuditLogs", "AppServicePlatformLogs",
    "FunctionAppLogs", "ComputerGroup", "W3CIISLog", "ETWEvent"
)

# Application Insights tables (typically contain most data)
$appInsightsTables = @(
    "AppMetrics",        # Usually largest - can be 60+ GB
    "AppTraces",         # Second largest - can be 20+ GB  
    "AppDependencies",   # 4+ GB typical
    "AppExceptions",     # 4+ GB typical
    "AppPerformanceCounters", # 200+ MB
    "AppRequests",       # 60+ MB
    "AppEvents",
    "AppPageViews",
    "AppAvailabilityResults",
    "AppBrowserTimings",
    "AppSystemEvents"
)

# Workspace details - UPDATE THESE VALUES
$subscriptionId = "9fcea53e-09b0-441b-89bb-57736a74663c"
$resourceGroup = "DefaultResourceGroup-EUS2"
$workspaceName = "DefaultWorkspace-9fcea53e-09b0-441b-89bb-57736a74663c-EUS2"

$successfulPurges = @()
$failedPurges = @()

Write-Host "=== STARTING BULK PURGE OPERATION ===" -ForegroundColor Cyan
Write-Host "Workspace: $workspaceName" -ForegroundColor White
Write-Host "Resource Group: $resourceGroup" -ForegroundColor White
Write-Host "Tables to process: $($tables.Count + $appInsightsTables.Count)" -ForegroundColor White
Write-Host ""

# Combine all tables
$allTables = $tables + $appInsightsTables

foreach ($table in $allTables) {
    Write-Host "Purging table: $table" -ForegroundColor Yellow
    
    # Create purge request body
    $jsonBody = @{
        table = $table
        filters = @(
            @{
                column = "TimeGenerated"
                operator = ">"
                value = "1900-01-01T00:00:00Z"
            }
        )
    } | ConvertTo-Json -Depth 3
    
    $jsonBody | Out-File -FilePath "purge-$table.json" -Encoding utf8
    
    try {
        $uri = "https://management.azure.com/subscriptions/$subscriptionId/resourceGroups/$resourceGroup/providers/Microsoft.OperationalInsights/workspaces/$workspaceName/purge?api-version=2023-09-01"
        
        $result = az rest --method post --uri $uri --body "@purge-$table.json" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $operationId = ($result | ConvertFrom-Json).operationId
            Write-Host "✓ Successfully initiated purge for $table. OperationId: $operationId" -ForegroundColor Green
            $successfulPurges += @{ Table = $table; OperationId = $operationId }
        } else {
            Write-Host "✗ Failed to purge $table. Error: $result" -ForegroundColor Red
            $failedPurges += @{ Table = $table; Error = $result }
            
            # Check for rate limiting
            if ($result -like "*Rate limit*") {
                Write-Host "⚠️ Rate limit reached (50/hour). Wait 1 hour before continuing." -ForegroundColor Yellow
                break
            }
        }
    } catch {
        Write-Host "✗ Exception purging $table. Error: $($_.Exception.Message)" -ForegroundColor Red
        $failedPurges += @{ Table = $table; Error = $_.Exception.Message }
    }
    
    # Clean up temp file
    Remove-Item "purge-$table.json" -ErrorAction SilentlyContinue
    
    # Delay to avoid rate limiting
    Start-Sleep -Seconds 2
}

# Display summary
Write-Host "`n=== PURGE OPERATION SUMMARY ===" -ForegroundColor Cyan
Write-Host "Successful purges: $($successfulPurges.Count)" -ForegroundColor Green
Write-Host "Failed purges: $($failedPurges.Count)" -ForegroundColor Red

if ($successfulPurges.Count -gt 0) {
    Write-Host "`nSuccessful purges:" -ForegroundColor Green
    $successfulPurges | ForEach-Object { Write-Host "  - $($_.Table): $($_.OperationId)" }
}

if ($failedPurges.Count -gt 0) {
    Write-Host "`nFailed purges:" -ForegroundColor Red
    $failedPurges | ForEach-Object { Write-Host "  - $($_.Table): $($_.Error)" }
}
```

## Monitoring Purge Operations

### Check Operation Status

```powershell
# Monitor specific operation
$operationId = "purge-5861dc24-a9fe-48c7-a09b-749f756e77a2"
$subscriptionId = "your-subscription-id"
$resourceGroup = "your-resource-group"
$workspaceName = "your-workspace-name"

$statusUri = "https://management.azure.com/subscriptions/$subscriptionId/resourceGroups/$resourceGroup/providers/Microsoft.OperationalInsights/workspaces/$workspaceName/operations/$operationId?api-version=2023-09-01"

az rest --method get --uri $statusUri
```

### Expected Status Responses

**In Progress:**
```json
{
  "status": "InProgress"
}
```

**Completed:**
```json
{
  "status": "Succeeded",
  "properties": {
    "recordsAffected": 1234567
  }
}
```

**Failed:**
```json
{
  "status": "Failed",
  "error": {
    "code": "ErrorCode",
    "message": "Error description"
  }
}
```

## Checking Workspace Usage

### Current Usage Command

```powershell
az monitor log-analytics workspace list-usages --resource-group "your-resource-group" --workspace-name "your-workspace-name" --output table
```

### Workspace Details

```powershell
az monitor log-analytics workspace show --resource-group "your-resource-group" --workspace-name "your-workspace-name" --query "{name: name, location: location, sku: sku.name, retentionInDays: retentionInDays, dailyQuotaGb: dailyQuotaGb, workspaceId: customerId}" --output table
```

### List All Tables

```powershell
az monitor log-analytics workspace table list --resource-group "your-resource-group" --workspace-name "your-workspace-name" --output table
```

## Rate Limiting and Best Practices

### Rate Limits
- **50 purge requests per hour** per workspace
- Throttling applies across all operations
- Counter resets every hour

### Best Practices
1. **Prioritize high-volume tables** (AppMetrics, AppTraces first)
2. **Use delays** between requests (2-3 seconds minimum)
3. **Monitor progress** - operations can take hours
4. **Batch operations** when possible
5. **Plan for multiple sessions** due to rate limits

### Error Handling
- **ThrottledError**: Wait for rate limit reset
- **BadArgumentError**: Check table name validity
- **QueryValidationError**: Verify table exists

## Common Table Data Volumes

Based on typical Application Insights workloads:

| Table | Typical Size | Description |
|-------|-------------|-------------|
| AppMetrics | 60-70 GB | Custom metrics, performance counters |
| AppTraces | 20-30 GB | Application logging, traces |
| AppDependencies | 4-5 GB | External service calls |
| AppExceptions | 4-5 GB | Application exceptions |
| AppPerformanceCounters | 200-300 MB | System performance data |
| AppRequests | 50-100 MB | HTTP requests |
| AzureActivity | Variable | Azure resource operations |
| AzureMetrics | Variable | Azure resource metrics |

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```bash
   az login --tenant your-tenant-id
   ```

2. **Permission Errors**
   - Ensure you have "Data Purger" role
   - Check workspace access permissions

3. **Rate Limit Exceeded**
   - Wait 1 hour for reset
   - Use fewer concurrent operations

4. **Invalid Table Names**
   - List tables first to verify names
   - Check for typos in table names

### Verification Commands

```powershell
# Verify authentication
az account show

# List available tables
az monitor log-analytics workspace table list --resource-group "rg" --workspace-name "ws" --query "[].name" --output tsv

# Check current usage (should show 0.0 Bytes after successful purge)
az monitor log-analytics workspace list-usages --resource-group "rg" --workspace-name "ws" --output table
```

## Security Considerations

1. **Temporary Role Assignment**: Only assign Data Purger role when needed
2. **Audit Trail**: All purge operations are logged in Azure Activity Log
3. **Compliance**: Document purge operations for regulatory requirements
4. **Backup Considerations**: Ensure no critical data is lost

## Example: Complete Workspace Cleanup

```powershell
# 1. Check current usage
Write-Host "=== CURRENT WORKSPACE USAGE ===" -ForegroundColor Cyan
az monitor log-analytics workspace list-usages --resource-group "DefaultResourceGroup-EUS2" --workspace-name "DefaultWorkspace-9fcea53e-09b0-441b-89bb-57736a74663c-EUS2" --output table

# 2. Run bulk purge script (see above)

# 3. Monitor operations (check every 30 minutes)
# Use operation IDs from purge responses

# 4. Verify cleanup
Write-Host "=== POST-PURGE USAGE ===" -ForegroundColor Cyan
az monitor log-analytics workspace list-usages --resource-group "DefaultResourceGroup-EUS2" --workspace-name "DefaultWorkspace-9fcea53e-09b0-441b-89bb-57736a74663c-EUS2" --output table
```

## Expected Results

After successful purge operations:
- **Current Usage**: 0.0 Bytes
- **Storage Costs**: Eliminated for purged data
- **Query Performance**: Improved (less data to scan)
- **Retention**: Only new data will be retained

---

**Last Updated**: January 2025  
**Azure CLI Version**: 2.57.0+  
**API Version**: 2023-09-01 