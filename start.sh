#!/bin/bash

# DCN Network Simulation Dashboard - Quick Start Script
# This script starts both the Flask backend and React frontend servers

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
port_available() {
    ! lsof -i :$1 >/dev/null 2>&1
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ ! -z "$pids" ]; then
        print_warning "Killing existing processes on port $port"
        echo $pids | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Print banner
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════╗"
echo "║          DCN Network Simulation             ║"
echo "║            Dashboard Launcher               ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
print_status "Checking prerequisites..."

# Check Python
if ! command_exists python3; then
    print_error "Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Check Node.js
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check npm
if ! command_exists npm; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_success "All prerequisites are installed"

# Get Python and Node versions
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
NODE_VERSION=$(node --version | cut -c2-)
NPM_VERSION=$(npm --version)

print_info "Python version: $PYTHON_VERSION"
print_info "Node.js version: $NODE_VERSION"
print_info "npm version: $NPM_VERSION"

# Check project structure
if [ ! -f "app.py" ]; then
    print_error "app.py not found. Please run this script from the project root directory."
    exit 1
fi

if [ ! -d "frontend" ]; then
    print_error "frontend directory not found. Please run this script from the project root directory."
    exit 1
fi

print_success "Project structure verified"

# Backend setup
print_status "Setting up backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    if [ $? -eq 0 ]; then
        print_success "Virtual environment created"
    else
        print_error "Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
if [ -f "requirements.txt" ]; then
    print_info "Installing Python dependencies..."
    pip install -r requirements.txt >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Python dependencies installed"
    else
        print_error "Failed to install Python dependencies"
        exit 1
    fi
else
    print_warning "requirements.txt not found, skipping Python dependency installation"
fi

# Frontend setup
print_status "Setting up frontend..."

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_info "Installing Node.js dependencies..."
    npm install >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Node.js dependencies installed"
    else
        print_error "Failed to install Node.js dependencies"
        exit 1
    fi
else
    print_info "Node.js dependencies already installed"
fi

cd ..

# Check and clean up ports
print_status "Checking and cleaning up ports..."

# Check backend port (5001)
if ! port_available 5001; then
    print_warning "Port 5001 is in use"
    kill_port 5001
fi

# Check frontend port (3000)
if ! port_available 3000; then
    print_warning "Port 3000 is in use"
    kill_port 3000
fi

# Check alternative frontend port (3002)
if ! port_available 3002; then
    print_warning "Port 3002 is in use"
    kill_port 3002
fi

print_success "Ports are ready"

# Start servers
print_status "Starting servers..."

# Start backend in background
print_info "Starting Flask backend server on port 5001..."
export FLASK_ENV=development
nohup python3 app.py > backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! port_available 5001; then
    print_success "Backend server started (PID: $BACKEND_PID)"
else
    print_error "Failed to start backend server"
    print_info "Check backend.log for errors"
    exit 1
fi

# Start frontend
print_info "Starting React frontend server..."
cd frontend

# Set frontend port to 3002 to avoid conflicts
export PORT=3002

# Start frontend in background
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!

cd ..

# Wait for frontend to start
print_info "Waiting for frontend server to start..."
sleep 10

# Check if frontend started successfully
if ! port_available 3002; then
    print_success "Frontend server started (PID: $FRONTEND_PID)"
else
    print_error "Failed to start frontend server"
    print_info "Check frontend.log for errors"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Success message
echo ""
print_success "🎉 DCN Network Simulation Dashboard is now running!"
echo ""
print_info "🔗 Frontend Dashboard: ${CYAN}http://localhost:3002${NC}"
print_info "🔗 Backend API: ${CYAN}http://localhost:5001${NC}"
echo ""
print_info "📄 Logs:"
print_info "   Backend: backend.log"
print_info "   Frontend: frontend.log"
echo ""
print_info "🛑 To stop servers:"
print_info "   Kill backend: kill $BACKEND_PID"
print_info "   Kill frontend: kill $FRONTEND_PID"
print_info "   Or use: pkill -f 'python.*app.py' && pkill -f 'node.*react-scripts'"
echo ""

# Save PIDs to file for easy cleanup
echo $BACKEND_PID > .backend_pid
echo $FRONTEND_PID > .frontend_pid

print_info "💡 PIDs saved to .backend_pid and .frontend_pid files"
print_info "🔄 Run './stop.sh' to stop all servers"

# Keep script running and monitor servers
print_status "Monitoring servers... Press Ctrl+C to stop monitoring (servers will continue running)"
echo ""

trap 'print_info "Monitoring stopped. Servers are still running."; exit 0' INT

# Monitor loop
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend server stopped unexpectedly!"
        break
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Frontend server stopped unexpectedly!"
        break
    fi
    
    sleep 5
done
