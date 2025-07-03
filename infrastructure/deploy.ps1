#!/usr/bin/env pwsh
# Code Racer Infrastructure Deployment Script
# This script deploys the Code Racer infrastructure to Azure using Bicep

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "East US",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "coderacer",
    
    [Parameter(Mandatory=$true)]
    [string]$PostgresAdminPassword,
    
    [Parameter(Mandatory=$true)]
    [string]$OpenAiApiKey,
    
    [Parameter(Mandatory=$false)]
    [switch]$WhatIf
)

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param($Message, $Color = $Reset)
    Write-Host "${Color}${Message}${Reset}"
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." $Blue
    
    # Check if Azure CLI is installed
    try {
        $azVersion = az --version 2>$null
        if ($azVersion) {
            Write-ColorOutput "✅ Azure CLI is installed" $Green
        }
    }
    catch {
        Write-ColorOutput "❌ Azure CLI is not installed or not in PATH" $Red
        exit 1
    }
    
    # Check if logged in to Azure
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        if ($account) {
            Write-ColorOutput "✅ Logged in to Azure as $($account.user.name)" $Green
            Write-ColorOutput "   Subscription: $($account.name) ($($account.id))" $Green
        }
    }
    catch {
        Write-ColorOutput "❌ Not logged in to Azure. Please run 'az login'" $Red
        exit 1
    }
    
    # Check if Bicep is available
    try {
        $bicepVersion = az bicep version 2>$null
        if ($bicepVersion) {
            Write-ColorOutput "✅ Bicep is available" $Green
        }
    }
    catch {
        Write-ColorOutput "⚠️  Bicep not found, installing..." $Yellow
        az bicep install
        Write-ColorOutput "✅ Bicep installed" $Green
    }
}

function New-ResourceGroup {
    param($Name, $Location)
    
    Write-ColorOutput "🏗️  Creating resource group '$Name' in '$Location'..." $Blue
    
    $rg = az group show --name $Name 2>$null | ConvertFrom-Json
    if ($rg) {
        Write-ColorOutput "✅ Resource group '$Name' already exists" $Green
    }
    else {
        if ($WhatIf) {
            Write-ColorOutput "🔍 [WHAT-IF] Would create resource group '$Name'" $Yellow
        }
        else {
            az group create --name $Name --location $Location | Out-Null
            Write-ColorOutput "✅ Resource group '$Name' created" $Green
        }
    }
}

function Deploy-Infrastructure {
    param($ResourceGroupName, $TemplateFile, $ParametersFile)
    
    Write-ColorOutput "🚀 Deploying Code Racer infrastructure..." $Blue
    
    $deploymentName = "coderacer-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    # Create parameters object
    $parameters = @{
        appName = $AppName
        environment = $Environment
        location = $Location
        postgresAdminPassword = $PostgresAdminPassword
        openAiApiKey = $OpenAiApiKey
    }
    
    # Convert to JSON
    $parametersJson = $parameters | ConvertTo-Json -Compress
    
    if ($WhatIf) {
        Write-ColorOutput "🔍 [WHAT-IF] Running deployment validation..." $Yellow
        
        $result = az deployment group what-if `
            --resource-group $ResourceGroupName `
            --template-file $TemplateFile `
            --parameters $parametersJson `
            --name $deploymentName
        
        Write-ColorOutput "🔍 What-if analysis completed" $Yellow
        Write-Output $result
    }
    else {
        Write-ColorOutput "⏳ Starting deployment (this may take 15-20 minutes)..." $Yellow
        
        $result = az deployment group create `
            --resource-group $ResourceGroupName `
            --template-file $TemplateFile `
            --parameters $parametersJson `
            --name $deploymentName `
            --output json | ConvertFrom-Json
        
        if ($result.properties.provisioningState -eq "Succeeded") {
            Write-ColorOutput "✅ Deployment completed successfully!" $Green
            
            # Display outputs
            Write-ColorOutput "`n📋 Deployment Outputs:" $Blue
            Write-ColorOutput "===================" $Blue
            
            $outputs = $result.properties.outputs
            foreach ($output in $outputs.PSObject.Properties) {
                Write-ColorOutput "   $($output.Name): $($output.Value.value)" $Green
            }
            
            # Save outputs to file
            $outputsFile = "infrastructure/deployment-outputs.json"
            $outputs | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputsFile -Encoding UTF8
            Write-ColorOutput "`n💾 Outputs saved to: $outputsFile" $Blue
        }
        else {
            Write-ColorOutput "❌ Deployment failed!" $Red
            Write-ColorOutput "Error: $($result.properties.error.message)" $Red
            exit 1
        }
    }
}

function Show-NextSteps {
    Write-ColorOutput "`n🎯 Next Steps:" $Blue
    Write-ColorOutput "==============" $Blue
    Write-ColorOutput "1. 📦 Build and push container images to ACR" $Green
    Write-ColorOutput "2. 🔧 Configure kubectl to connect to AKS cluster" $Green
    Write-ColorOutput "3. 🚀 Deploy application to Kubernetes" $Green
    Write-ColorOutput "4. 🌐 Configure DNS and SSL certificates" $Green
    
    Write-ColorOutput "`n💡 Useful commands:" $Blue
    Write-ColorOutput "   # Connect to AKS cluster" $Blue
    Write-ColorOutput "   az aks get-credentials --resource-group $ResourceGroupName --name $AppName-$Environment-aks" $Blue
    Write-ColorOutput "   " $Blue
    Write-ColorOutput "   # Get ACR login server" $Blue
    Write-ColorOutput "   az acr show --resource-group $ResourceGroupName --name $($AppName)$($Environment)acr --query loginServer" $Blue
}

# Main execution
Write-ColorOutput "🚀 Code Racer Infrastructure Deployment" $Blue
Write-ColorOutput "=======================================" $Blue

# Validate inputs
if ($PostgresAdminPassword.Length -lt 8) {
    Write-ColorOutput "❌ PostgreSQL admin password must be at least 8 characters" $Red
    exit 1
}

if ($OpenAiApiKey -eq "REPLACE_WITH_OPENAI_API_KEY" -or $OpenAiApiKey.Length -lt 10) {
    Write-ColorOutput "❌ Please provide a valid OpenAI API key" $Red
    exit 1
}

# Set file paths
$templateFile = "infrastructure/bicep/main.bicep"
$parametersFile = "infrastructure/bicep/parameters.json"

# Check if template file exists
if (-not (Test-Path $templateFile)) {
    Write-ColorOutput "❌ Template file not found: $templateFile" $Red
    exit 1
}

# Run deployment steps
Test-Prerequisites
New-ResourceGroup -Name $ResourceGroupName -Location $Location
Deploy-Infrastructure -ResourceGroupName $ResourceGroupName -TemplateFile $templateFile -ParametersFile $parametersFile

if (-not $WhatIf) {
    Show-NextSteps
}

Write-ColorOutput "`n✅ Deployment script completed!" $Green 