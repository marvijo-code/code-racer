#!/bin/bash
# Code Racer - Development Environment Starter (Linux)
# This script manages the backend and frontend services with proper port management

# Configuration
BACKEND_PORT=8080
FRONTEND_PORT=3113
BACKEND_DIR="Backend"
FRONTEND_DIR="frontend"

# Colors for output
RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
CYAN='\033[36m'
WHITE='\033[37m'
RESET='\033[0m'

# Function to print colored output
write_color_output() {
    local message="$1"
    local color="${2:-$RESET}"
    echo -e "${color}${message}${RESET}"
}

# Function to get process ID by port
get_process_by_port() {
    local port="$1"
    local pid=$(lsof -ti :$port 2>/dev/null)
    echo "$pid"
}

# Function to stop process by port
stop_process_by_port() {
    local port="$1"
    local service_name="$2"
    local pid=$(get_process_by_port $port)
    
    if [ -n "$pid" ]; then
        local process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        write_color_output "⚠️  Port $port is in use by $process_name (PID: $pid)" "$YELLOW"
        write_color_output "🛑 Stopping $service_name process..." "$RED"
        
        kill -TERM $pid 2>/dev/null
        sleep 2
        
        # Check if process is still running
        if kill -0 $pid 2>/dev/null; then
            # Force kill if still running
            kill -KILL $pid 2>/dev/null
            sleep 1
        fi
        
        # Verify it's stopped
        local still_running=$(get_process_by_port $port)
        if [ -n "$still_running" ]; then
            write_color_output "❌ Failed to stop process on port $port" "$RED"
            return 1
        else
            write_color_output "✅ Successfully stopped process on port $port" "$GREEN"
            return 0
        fi
    fi
    return 0
}

# Function to test if port is available
test_port_available() {
    local port="$1"
    local pid=$(get_process_by_port $port)
    [ -z "$pid" ]
}

# Function to start backend
start_backend() {
    write_color_output "🚀 Starting Backend (.NET API with Hot Reload)..." "$BLUE"
    
    if [ ! -d "$BACKEND_DIR" ]; then
        write_color_output "❌ Backend directory not found: $BACKEND_DIR" "$RED"
        return 1
    fi
    
    # Check if backend is already running
    if ! test_port_available $BACKEND_PORT && [ "$FORCE_RESTART" = false ]; then
        write_color_output "✅ Backend already running on port $BACKEND_PORT with hot reload" "$GREEN"
        write_color_output "   Changes will be automatically reloaded without restart" "$CYAN"
        return 0
    elif ! test_port_available $BACKEND_PORT && [ "$FORCE_RESTART" = true ]; then
        write_color_output "🔄 Force restarting backend..." "$YELLOW"
        if ! stop_process_by_port $BACKEND_PORT "Backend"; then
            return 1
        fi
    fi
    
    # Start backend in new terminal window with hot reload
    write_color_output "🚀 Starting backend with hot reload in new window..." "$GREEN"
    local backend_path=$(realpath "$BACKEND_DIR")
    
    # Try different terminal emulators with dotnet watch for hot reload
    if command -v gnome-terminal >/dev/null 2>&1; then
        gnome-terminal --title="Code Racer Backend (Hot Reload)" -- bash -c "cd '$backend_path' && dotnet watch run; exec bash" &
    elif command -v xterm >/dev/null 2>&1; then
        xterm -title "Code Racer Backend (Hot Reload)" -e "cd '$backend_path' && dotnet watch run; exec bash" &
    elif command -v konsole >/dev/null 2>&1; then
        konsole --title "Code Racer Backend (Hot Reload)" -e bash -c "cd '$backend_path' && dotnet watch run; exec bash" &
    elif command -v terminator >/dev/null 2>&1; then
        terminator --title="Code Racer Backend (Hot Reload)" -x bash -c "cd '$backend_path' && dotnet watch run; exec bash" &
    else
        # Fallback: run in background with hot reload
        write_color_output "⚠️  No terminal emulator found, running backend with hot reload in background..." "$YELLOW"
        (cd "$backend_path" && nohup dotnet watch run > backend.log 2>&1 &)
    fi
    
    write_color_output "⏳ Waiting for backend to start..." "$YELLOW"
    
    # Wait for backend to be ready (max 30 seconds)
    local timeout=30
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        sleep 2
        elapsed=$((elapsed + 2))
        
        if curl -s -f "http://localhost:$BACKEND_PORT/api/v1/questions/random" >/dev/null 2>&1; then
            write_color_output "✅ Backend is ready on http://localhost:$BACKEND_PORT" "$GREEN"
            return 0
        fi
        
        echo -n "."
    done
    
    write_color_output "\n❌ Backend failed to start within $timeout seconds" "$RED"
    return 1
}

# Function to start frontend
start_frontend() {
    write_color_output "🎨 Starting Frontend (React + Vite with Hot Reload)..." "$BLUE"
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        write_color_output "❌ Frontend directory not found: $FRONTEND_DIR" "$RED"
        return 1
    fi
    
    # Check if frontend is already running
    if ! test_port_available $FRONTEND_PORT && [ "$FORCE_RESTART" = false ]; then
        write_color_output "✅ Frontend already running on port $FRONTEND_PORT with hot reload" "$GREEN"
        write_color_output "   Changes will be automatically reloaded in browser" "$CYAN"
        return 0
    elif ! test_port_available $FRONTEND_PORT && [ "$FORCE_RESTART" = true ]; then
        write_color_output "🔄 Force restarting frontend..." "$YELLOW"
        if ! stop_process_by_port $FRONTEND_PORT "Frontend"; then
            return 1
        fi
    fi
    
    # Start frontend in new terminal window with hot reload
    write_color_output "🎨 Starting frontend with hot reload in new window..." "$GREEN"
    local frontend_path=$(realpath "$FRONTEND_DIR")
    
    # Try different terminal emulators (Vite already has HMR built-in)
    if command -v gnome-terminal >/dev/null 2>&1; then
        gnome-terminal --title="Code Racer Frontend (Hot Reload)" -- bash -c "cd '$frontend_path' && npm run dev; exec bash" &
    elif command -v xterm >/dev/null 2>&1; then
        xterm -title "Code Racer Frontend (Hot Reload)" -e "cd '$frontend_path' && npm run dev; exec bash" &
    elif command -v konsole >/dev/null 2>&1; then
        konsole --title "Code Racer Frontend (Hot Reload)" -e bash -c "cd '$frontend_path' && npm run dev; exec bash" &
    elif command -v terminator >/dev/null 2>&1; then
        terminator --title="Code Racer Frontend (Hot Reload)" -x bash -c "cd '$frontend_path' && npm run dev; exec bash" &
    else
        # Fallback: run in background with hot reload
        write_color_output "⚠️  No terminal emulator found, running frontend with hot reload in background..." "$YELLOW"
        (cd "$frontend_path" && nohup npm run dev > frontend.log 2>&1 &)
    fi
    
    write_color_output "⏳ Waiting for frontend to start..." "$YELLOW"
    
    # Wait for frontend to be ready (max 30 seconds)
    local timeout=30
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        sleep 2
        elapsed=$((elapsed + 2))
        
        if curl -s -f "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
            write_color_output "✅ Frontend is ready on http://localhost:$FRONTEND_PORT" "$GREEN"
            return 0
        fi
        
        echo -n "."
    done
    
    write_color_output "\n❌ Frontend failed to start within $timeout seconds" "$RED"
    return 1
}

# Function to show status
show_status() {
    write_color_output "📊 Code Racer Status" "$BLUE"
    write_color_output "===================" "$BLUE"
    
    # Check Backend
    if ! test_port_available $BACKEND_PORT; then
        write_color_output "✅ Backend: Running on http://localhost:$BACKEND_PORT" "$GREEN"
        if curl -s -f "http://localhost:$BACKEND_PORT/api/v1/questions/random" >/dev/null 2>&1; then
            local status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT/api/v1/questions/random" 2>/dev/null)
            write_color_output "   API Status: Responding (HTTP $status_code)" "$GREEN"
        else
            write_color_output "   API Status: Not responding" "$RED"
        fi
    else
        write_color_output "❌ Backend: Not running" "$RED"
    fi
    
    # Check Frontend
    if ! test_port_available $FRONTEND_PORT; then
        write_color_output "✅ Frontend: Running on http://localhost:$FRONTEND_PORT" "$GREEN"
        if curl -s -f "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
            local status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" 2>/dev/null)
            write_color_output "   UI Status: Accessible (HTTP $status_code)" "$GREEN"
        else
            write_color_output "   UI Status: Not accessible" "$RED"
        fi
    else
        write_color_output "❌ Frontend: Not running" "$RED"
    fi
    
    # Check Docker services
    write_color_output "\n🐳 Docker Services:" "$BLUE"
    if command -v docker-compose >/dev/null 2>&1; then
        local docker_services=$(docker-compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null)
        if [ -n "$docker_services" ] && [ "$docker_services" != "NAME STATUS" ]; then
            write_color_output "$docker_services" "$GREEN"
        else
            write_color_output "   Docker services not running" "$YELLOW"
        fi
    else
        write_color_output "   Docker not available" "$RED"
    fi
}

# Function to stop services
stop_services() {
    write_color_output "🛑 Stopping Code Racer services..." "$RED"
    
    # Stop backend
    if ! test_port_available $BACKEND_PORT; then
        stop_process_by_port $BACKEND_PORT "Backend"
    fi
    
    # Stop frontend
    if ! test_port_available $FRONTEND_PORT; then
        stop_process_by_port $FRONTEND_PORT "Frontend"
    fi
    
    # Stop any remaining node/dotnet processes
    write_color_output "🧹 Cleaning up remaining processes..." "$YELLOW"
    
    # Kill node processes that might be running our frontend
    pkill -f "npm run dev" 2>/dev/null && write_color_output "   Stopped npm processes" "$YELLOW"
    
    # Kill dotnet processes that might be running our backend
    pkill -f "dotnet run" 2>/dev/null && write_color_output "   Stopped dotnet processes" "$YELLOW"
    
    write_color_output "✅ All services stopped" "$GREEN"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --status, -s     Show service status"
    echo "  --stop           Stop all services"
    echo "  --restart, -r    Restart all services"
    echo "  --force, -f      Force restart even if services are running"
    echo "  --help, -h       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0               Start Code Racer services (with hot reload)"
    echo "  $0 --status      Check service status"
    echo "  $0 --stop        Stop all services"
    echo "  $0 --restart     Restart all services"
    echo "  $0 --force       Force restart services (ignores hot reload)"
    echo ""
    echo "Hot Reload Features:"
    echo "  • Frontend: Vite automatically reloads changes in browser"
    echo "  • Backend: .NET watch automatically recompiles and restarts on changes"
    echo "  • No need to restart manually - just save your files!"
}

# Parse command line arguments
FORCE_RESTART=false
case "${1:-}" in
    --status|-s)
        show_status
        exit 0
        ;;
    --stop)
        stop_services
        exit 0
        ;;
    --restart|-r)
        write_color_output "🔄 Restarting Code Racer..." "$YELLOW"
        stop_services
        sleep 3
        ;;
    --force|-f)
        write_color_output "🔄 Force restarting Code Racer (ignoring hot reload)..." "$YELLOW"
        FORCE_RESTART=true
        stop_services
        sleep 3
        ;;
    --help|-h)
        show_usage
        exit 0
        ;;
    "")
        # Default: start services
        ;;
    *)
        write_color_output "❌ Unknown option: $1" "$RED"
        show_usage
        exit 1
        ;;
esac

# Start services
write_color_output "🚀 Starting Code Racer development environment..." "$GREEN"

# Start Docker services first
write_color_output "🐳 Starting Docker services..." "$BLUE"
if command -v docker-compose >/dev/null 2>&1; then
    if docker-compose up -d postgres milvus etcd minio redis 2>/dev/null; then
        write_color_output "✅ Docker services started" "$GREEN"
    else
        write_color_output "⚠️  Docker services may not be available" "$YELLOW"
    fi
else
    write_color_output "⚠️  Docker Compose not found" "$YELLOW"
fi

# Start backend
if ! start_backend; then
    write_color_output "❌ Failed to start backend" "$RED"
    exit 1
fi

# Start frontend
if ! start_frontend; then
    write_color_output "❌ Failed to start frontend" "$RED"
    exit 1
fi

# Success!
write_color_output "\n🎉 Code Racer is ready with Hot Reload!" "$GREEN"
write_color_output "📱 Frontend: http://localhost:$FRONTEND_PORT" "$GREEN"
write_color_output "🔧 Backend API: http://localhost:$BACKEND_PORT" "$GREEN"
write_color_output "📊 API Test: http://localhost:$BACKEND_PORT/api/v1/questions/random" "$GREEN"

write_color_output "\n🔥 Hot Reload Active:" "$BLUE"
write_color_output "   • Frontend changes reload instantly in browser" "$CYAN"
write_color_output "   • Backend changes auto-recompile and restart" "$CYAN"
write_color_output "   • Just save your files - no manual restart needed!" "$CYAN"

write_color_output "\n💡 Useful commands:" "$BLUE"
write_color_output "   ./start-coderacer.sh --status    # Check status" "$BLUE"
write_color_output "   ./start-coderacer.sh --stop      # Stop all services" "$BLUE"
write_color_output "   ./start-coderacer.sh --force     # Force restart (ignores hot reload)" "$BLUE"

write_color_output "\n⚡ Backend and Frontend are running in separate terminal windows" "$YELLOW"
write_color_output "🛑 Close the terminal windows or use ./start-coderacer.sh --stop to stop services" "$YELLOW"

write_color_output "\n✅ Development environment ready! Edit code and see changes instantly." "$GREEN" 