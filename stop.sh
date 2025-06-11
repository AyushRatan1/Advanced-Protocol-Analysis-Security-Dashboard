#!/bin/bash

# DCN Network Simulation Dashboard - Stop Script
# This script stops both the Flask backend and React frontend servers

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[DCN]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Print banner
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════╗"
echo "║          DCN Network Simulation             ║"
echo "║            Shutdown Script                  ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

print_status "Stopping DCN Network Simulation Dashboard..."

# Function to kill process by PID
kill_pid() {
    local pid=$1
    local name=$2
    
    if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        print_info "Stopping $name (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            print_warning "Force killing $name..."
            kill -9 "$pid" 2>/dev/null || true
            sleep 1
        fi
        
        if ! kill -0 "$pid" 2>/dev/null; then
            print_success "$name stopped successfully"
        else
            print_error "Failed to stop $name"
        fi
    else
        print_warning "$name is not running or PID file is invalid"
    fi
}

# Stop servers using PID files
if [ -f ".backend_pid" ]; then
    BACKEND_PID=$(cat .backend_pid)
    kill_pid "$BACKEND_PID" "Backend server"
    rm -f .backend_pid
else
    print_warning "Backend PID file not found"
fi

if [ -f ".frontend_pid" ]; then
    FRONTEND_PID=$(cat .frontend_pid)
    kill_pid "$FRONTEND_PID" "Frontend server"
    rm -f .frontend_pid
else
    print_warning "Frontend PID file not found"
fi

# Fallback: Kill processes by pattern
print_info "Cleaning up any remaining processes..."

# Kill Flask app processes
FLASK_PIDS=$(pgrep -f "python.*app.py" 2>/dev/null || true)
if [ ! -z "$FLASK_PIDS" ]; then
    print_info "Found Flask processes: $FLASK_PIDS"
    echo $FLASK_PIDS | xargs kill 2>/dev/null || true
    sleep 2
    
    # Force kill if still running
    FLASK_PIDS=$(pgrep -f "python.*app.py" 2>/dev/null || true)
    if [ ! -z "$FLASK_PIDS" ]; then
        echo $FLASK_PIDS | xargs kill -9 2>/dev/null || true
    fi
fi

# Kill React development server processes
REACT_PIDS=$(pgrep -f "node.*react-scripts" 2>/dev/null || true)
if [ ! -z "$REACT_PIDS" ]; then
    print_info "Found React processes: $REACT_PIDS"
    echo $REACT_PIDS | xargs kill 2>/dev/null || true
    sleep 2
    
    # Force kill if still running
    REACT_PIDS=$(pgrep -f "node.*react-scripts" 2>/dev/null || true)
    if [ ! -z "$REACT_PIDS" ]; then
        echo $REACT_PIDS | xargs kill -9 2>/dev/null || true
    fi
fi

# Kill processes on specific ports
print_info "Cleaning up processes on ports 5001 and 3002..."

# Port 5001 (Backend)
PORT_5001_PIDS=$(lsof -ti :5001 2>/dev/null || true)
if [ ! -z "$PORT_5001_PIDS" ]; then
    echo $PORT_5001_PIDS | xargs kill 2>/dev/null || true
    sleep 1
    
    # Force kill if still running
    PORT_5001_PIDS=$(lsof -ti :5001 2>/dev/null || true)
    if [ ! -z "$PORT_5001_PIDS" ]; then
        echo $PORT_5001_PIDS | xargs kill -9 2>/dev/null || true
    fi
fi

# Port 3002 (Frontend)
PORT_3002_PIDS=$(lsof -ti :3002 2>/dev/null || true)
if [ ! -z "$PORT_3002_PIDS" ]; then
    echo $PORT_3002_PIDS | xargs kill 2>/dev/null || true
    sleep 1
    
    # Force kill if still running
    PORT_3002_PIDS=$(lsof -ti :3002 2>/dev/null || true)
    if [ ! -z "$PORT_3002_PIDS" ]; then
        echo $PORT_3002_PIDS | xargs kill -9 2>/dev/null || true
    fi
fi

# Port 3000 (Alternative frontend port)
PORT_3000_PIDS=$(lsof -ti :3000 2>/dev/null || true)
if [ ! -z "$PORT_3000_PIDS" ]; then
    echo $PORT_3000_PIDS | xargs kill 2>/dev/null || true
    sleep 1
    
    # Force kill if still running
    PORT_3000_PIDS=$(lsof -ti :3000 2>/dev/null || true)
    if [ ! -z "$PORT_3000_PIDS" ]; then
        echo $PORT_3000_PIDS | xargs kill -9 2>/dev/null || true
    fi
fi

# Clean up log files
print_info "Cleaning up log files..."
rm -f backend.log frontend.log

# Final verification
sleep 2
print_status "Verifying shutdown..."

REMAINING_FLASK=$(pgrep -f "python.*app.py" 2>/dev/null || true)
REMAINING_REACT=$(pgrep -f "node.*react-scripts" 2>/dev/null || true)
REMAINING_5001=$(lsof -ti :5001 2>/dev/null || true)
REMAINING_3002=$(lsof -ti :3002 2>/dev/null || true)

if [ -z "$REMAINING_FLASK" ] && [ -z "$REMAINING_REACT" ] && [ -z "$REMAINING_5001" ] && [ -z "$REMAINING_3002" ]; then
    print_success "🎉 All DCN servers stopped successfully!"
    print_info "📄 Log files cleaned up"
    print_info "🔄 Run './start.sh' to start the servers again"
else
    print_warning "Some processes might still be running:"
    [ ! -z "$REMAINING_FLASK" ] && print_warning "Flask processes: $REMAINING_FLASK"
    [ ! -z "$REMAINING_REACT" ] && print_warning "React processes: $REMAINING_REACT"
    [ ! -z "$REMAINING_5001" ] && print_warning "Port 5001 processes: $REMAINING_5001"
    [ ! -z "$REMAINING_3002" ] && print_warning "Port 3002 processes: $REMAINING_3002"
    print_info "You may need to manually kill these processes"
fi

echo ""
print_status "Shutdown complete!"
