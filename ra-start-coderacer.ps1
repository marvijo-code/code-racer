# Simple script to start both the backend and frontend for Code Racer

Write-Host "Starting Code Racer services..."

# Start Backend in a new PowerShell window
Write-Host "Starting Backend service..."
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd Backend; dotnet run"

# Start Frontend in a new PowerShell window
Write-Host "Starting Frontend service..."
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd frontend; npm install; pwsh ./node_modules/vite/bin/vite.js"

Write-Host "All services are starting up in separate windows." 