# Code Racer Development Environment Scripts

This directory contains platform-specific scripts to manage the Code Racer development environment.

## Available Scripts

### Windows (PowerShell)
- **File**: `start-coderacer.ps1`
- **Requirements**: PowerShell 5.1+ (PowerShell 7+ recommended)

### Linux/macOS (Bash)
- **File**: `start-coderacer.sh`
- **Requirements**: Bash 4.0+, curl, lsof

## Usage

### Windows PowerShell

```powershell
# Start all services
.\start-coderacer.ps1

# Check service status
.\start-coderacer.ps1 -Status

# Stop all services
.\start-coderacer.ps1 -Stop

# Restart all services
.\start-coderacer.ps1 -Restart
```

### Linux/macOS Bash

First, make the script executable:
```bash
chmod +x start-coderacer.sh
```

Then use it:
```bash
# Start all services
./start-coderacer.sh

# Check service status
./start-coderacer.sh --status
# or
./start-coderacer.sh -s

# Stop all services
./start-coderacer.sh --stop

# Restart all services
./start-coderacer.sh --restart
# or
./start-coderacer.sh -r

# Show help
./start-coderacer.sh --help
```

## What These Scripts Do

Both scripts provide identical functionality:

1. **Docker Services**: Starts required Docker containers (PostgreSQL, Milvus, etc.)
2. **Backend**: Launches the .NET API on port 8080
3. **Frontend**: Launches the React/Vite app on port 3113
4. **Port Management**: Automatically detects and stops conflicting processes
5. **Health Checks**: Waits for services to be ready before proceeding
6. **Status Monitoring**: Shows current status of all services

## Service Ports

- **Frontend**: http://localhost:3113
- **Backend API**: http://localhost:8080
- **API Test Endpoint**: http://localhost:8080/api/v1/questions/random

## Terminal Emulator Support (Linux)

The Linux script automatically detects and uses available terminal emulators:
- gnome-terminal (preferred)
- xterm
- konsole
- terminator
- Fallback: background execution with logging

## Dependencies

### Windows
- PowerShell 5.1+
- .NET SDK
- Node.js & npm
- Docker Desktop (optional)

### Linux
- Bash 4.0+
- curl
- lsof
- .NET SDK
- Node.js & npm
- Docker & Docker Compose (optional)
- Terminal emulator (gnome-terminal, xterm, etc.)

## Troubleshooting

### Port Already in Use
The scripts automatically detect and stop processes using the required ports. If this fails, you can manually check:

**Windows:**
```powershell
netstat -ano | findstr :8080
netstat -ano | findstr :3113
```

**Linux:**
```bash
lsof -i :8080
lsof -i :3113
```

### Services Not Starting
Check the logs in the terminal windows that open, or look for:
- `backend.log` (if running in background)
- `frontend.log` (if running in background)

### Docker Issues
Ensure Docker is running and accessible:
```bash
docker --version
docker-compose --version
```

## File Structure

```
.
├── start-coderacer.ps1      # Windows PowerShell script
├── start-coderacer.sh       # Linux/macOS Bash script
├── Backend/                 # .NET API project
├── frontend/                # React/Vite project
└── docker-compose.yml       # Docker services configuration
``` 