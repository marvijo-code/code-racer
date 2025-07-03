#!/usr/bin/env pwsh
# Code Racer - Development Environment Starter
# This script manages the backend and frontend services with proper port management

param(
    [switch]$Stop,
    [switch]$Restart,
    [switch]$Status
)

# Configuration
$BACKEND_PORT = 8080
$FRONTEND_PORT = 3113
$BACKEND_DIR = "Backend"
$FRONTEND_DIR = "frontend"

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Cyan = "`e[36m"
$White = "`e[37m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param($Message, $Color = $Reset)
    Write-Host "${Color}${Message}${Reset}"
}

function Get-ProcessByPort {
    param($Port)
    try {
        $netstat = netstat -ano | Select-String ":$Port\s"
        if ($netstat) {
            $processId = ($netstat -split '\s+')[-1]
            if ($processId -match '^\d+$') {
                return Get-Process -Id $processId -ErrorAction SilentlyContinue
            }
        }
    }
    catch {
        # Port not in use
    }
    return $null
}

function Stop-ProcessByPort {
    param($Port, $ServiceName)
    $process = Get-ProcessByPort -Port $Port
    if ($process) {
        Write-ColorOutput "⚠️  Port $Port is in use by $($process.ProcessName) (PID: $($process.Id))" $Yellow
        Write-ColorOutput "🛑 Stopping $ServiceName process..." $Red
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        # Verify it's stopped
        $stillRunning = Get-ProcessByPort -Port $Port
        if ($stillRunning) {
            Write-ColorOutput "❌ Failed to stop process on port $Port" $Red
            return $false
        } else {
            Write-ColorOutput "✅ Successfully stopped process on port $Port" $Green
            return $true
        }
    }
    return $true
}

function Test-PortAvailable {
    param($Port)
    $process = Get-ProcessByPort -Port $Port
    return $process -eq $null
}

function Start-Backend {
    Write-ColorOutput "🚀 Starting Backend (.NET API)..." $Blue
    
    if (-not (Test-Path $BACKEND_DIR)) {
        Write-ColorOutput "❌ Backend directory not found: $BACKEND_DIR" $Red
        return $false
    }
    
    # Check if backend is already running
    if (-not (Test-PortAvailable -Port $BACKEND_PORT)) {
        Write-ColorOutput "⚠️  Backend port $BACKEND_PORT is already in use" $Yellow
        if (-not (Stop-ProcessByPort -Port $BACKEND_PORT -ServiceName "Backend")) {
            return $false
        }
    }
    
    # Start backend as background job
    Write-ColorOutput "🚀 Starting backend..." $Green
    $backendPath = Resolve-Path $BACKEND_DIR
    $backendJob = Start-Job -Name "CodeRacer-Backend" -ScriptBlock {
        param($BackendPath)
        Set-Location $BackendPath
        dotnet run
    } -ArgumentList $backendPath
    
    Write-ColorOutput "✅ Backend started in background (Job ID: $($backendJob.Id))" $Green
    return $true
}

function Start-Frontend {
    Write-ColorOutput "🎨 Starting Frontend (React + Vite)..." $Blue
    
    if (-not (Test-Path $FRONTEND_DIR)) {
        Write-ColorOutput "❌ Frontend directory not found: $FRONTEND_DIR" $Red
        return $false
    }
    
    # Check if frontend is already running
    if (-not (Test-PortAvailable -Port $FRONTEND_PORT)) {
        Write-ColorOutput "⚠️  Frontend port $FRONTEND_PORT is already in use" $Yellow
        if (-not (Stop-ProcessByPort -Port $FRONTEND_PORT -ServiceName "Frontend")) {
            return $false
        }
    }
    
    # Start frontend as background job
    Write-ColorOutput "🎨 Starting frontend..." $Green
    $frontendPath = Resolve-Path $FRONTEND_DIR
    $frontendJob = Start-Job -Name "CodeRacer-Frontend" -ScriptBlock {
        param($FrontendPath)
        Set-Location $FrontendPath
        npm run dev
    } -ArgumentList $frontendPath
    
    Write-ColorOutput "✅ Frontend started in background (Job ID: $($frontendJob.Id))" $Green
    return $true
}

function Show-Status {
    Write-ColorOutput "📊 Code Racer Status" $Blue
    Write-ColorOutput "===================" $Blue
    
    # Check Backend
    $backendRunning = -not (Test-PortAvailable -Port $BACKEND_PORT)
    if ($backendRunning) {
        Write-ColorOutput "✅ Backend: Running on http://localhost:$BACKEND_PORT" $Green
    } else {
        Write-ColorOutput "❌ Backend: Not running" $Red
    }
    
    # Check Frontend
    $frontendRunning = -not (Test-PortAvailable -Port $FRONTEND_PORT)
    if ($frontendRunning) {
        Write-ColorOutput "✅ Frontend: Running on http://localhost:$FRONTEND_PORT" $Green
    } else {
        Write-ColorOutput "❌ Frontend: Not running" $Red
    }
    
    # Check background jobs
    Write-ColorOutput "`n🔧 Background Jobs:" $Blue
    $jobs = Get-Job | Where-Object { $_.Name -like "CodeRacer-*" }
    if ($jobs) {
        foreach ($job in $jobs) {
            $status = if ($job.State -eq "Running") { "✅" } else { "❌" }
            Write-ColorOutput "   $status $($job.Name): $($job.State)" $Green
        }
    } else {
        Write-ColorOutput "   No CodeRacer jobs running" $Yellow
    }
    
    # Check Docker services
    Write-ColorOutput "`n🐳 Docker Services:" $Blue
    try {
        $dockerServices = docker-compose ps --format "table {{.Name}}\t{{.Status}}" 2>$null
        if ($dockerServices) {
            Write-ColorOutput $dockerServices $Green
        } else {
            Write-ColorOutput "   Docker services not running" $Yellow
        }
    }
    catch {
        Write-ColorOutput "   Docker not available" $Red
    }
}

function Stop-Services {
    Write-ColorOutput "🛑 Stopping Code Racer services..." $Red
    
    # Stop background jobs
    $jobs = Get-Job | Where-Object { $_.Name -like "CodeRacer-*" }
    if ($jobs) {
        foreach ($job in $jobs) {
            Write-ColorOutput "🛑 Stopping job: $($job.Name)" $Yellow
            Stop-Job -Job $job -ErrorAction SilentlyContinue
            Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Stop processes by port
    if (-not (Test-PortAvailable -Port $BACKEND_PORT)) {
        Stop-ProcessByPort -Port $BACKEND_PORT -ServiceName "Backend"
    }
    
    if (-not (Test-PortAvailable -Port $FRONTEND_PORT)) {
        Stop-ProcessByPort -Port $FRONTEND_PORT -ServiceName "Frontend"
    }
    
    Write-ColorOutput "✅ All services stopped" $Green
}

function Show-Logs {
    Write-ColorOutput "📋 Showing service logs..." $Blue
    Write-ColorOutput "Press Ctrl+C to stop watching logs" $Yellow
    
    $jobs = Get-Job | Where-Object { $_.Name -like "CodeRacer-*" }
    if ($jobs) {
        try {
            while ($true) {
                foreach ($job in $jobs) {
                    $output = Receive-Job -Job $job -ErrorAction SilentlyContinue
                    if ($output) {
                        Write-ColorOutput "[$($job.Name)] $output" $Cyan
                    }
                }
                Start-Sleep -Seconds 1
            }
        }
        catch {
            Write-ColorOutput "`n🛑 Log watching stopped" $Yellow
        }
    } else {
        Write-ColorOutput "❌ No CodeRacer jobs running" $Red
    }
}

# Handle command line arguments
if ($Status) {
    Show-Status
    exit 0
}

if ($Stop) {
    Stop-Services
    exit 0
}

if ($Restart) {
    Write-ColorOutput "🔄 Restarting Code Racer..." $Yellow
    Stop-Services
    Start-Sleep -Seconds 3
}

# Start services
Write-ColorOutput "🚀 Starting Code Racer development environment..." $Green

# Start Docker services first
Write-ColorOutput "🐳 Starting Docker services..." $Blue
try {
    docker-compose up -d postgres milvus etcd minio redis 2>$null
    Write-ColorOutput "✅ Docker services started" $Green
}
catch {
    Write-ColorOutput "⚠️  Docker services may not be available" $Yellow
}

# Start backend
$backendStarted = Start-Backend
if (-not $backendStarted) {
    Write-ColorOutput "❌ Failed to start backend" $Red
    exit 1
}

# Start frontend
$frontendStarted = Start-Frontend
if (-not $frontendStarted) {
    Write-ColorOutput "❌ Failed to start frontend" $Red
    exit 1
}

# Give services a moment to start
Start-Sleep -Seconds 3

# Success!
Write-ColorOutput "`n🎉 Code Racer is ready!" $Green
Write-ColorOutput "📱 Frontend: http://localhost:$FRONTEND_PORT" $Green
Write-ColorOutput "🔧 Backend API: http://localhost:$BACKEND_PORT" $Green

Write-ColorOutput "`n💡 Useful commands:" $Blue
Write-ColorOutput "   .\start-coderacer.ps1 -Status    # Check status" $Blue
Write-ColorOutput "   .\start-coderacer.ps1 -Stop      # Stop all services" $Blue
Write-ColorOutput "   .\start-coderacer.ps1 -Restart   # Restart all services" $Blue

Write-ColorOutput "`n⚡ Services are running in background jobs with hot reload enabled" $Yellow
Write-ColorOutput "🛑 Use .\start-coderacer.ps1 -Stop to stop services" $Yellow

# Show logs
Write-ColorOutput "`n📋 Starting log viewer..." $Blue
Show-Logs 