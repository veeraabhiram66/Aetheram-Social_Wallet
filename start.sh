#!/bin/bash

# BlockDAG Smart Wallet Startup Script
echo "🚀 Starting BlockDAG Smart Wallet..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if netstat -tuln | grep ":$port " > /dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Kill any existing processes on our ports
echo "🔧 Cleaning up existing processes..."
pkill -f "node.*server" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true

# Wait a moment for processes to clean up
sleep 2

# Start Backend (Enhanced Server)
echo "🔥 Starting Enhanced Backend Server..."
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start the enhanced server
nohup node src/enhanced-server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started with PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Check if backend is running
if check_port 4000; then
    echo "✅ Backend is running on port 4000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start Frontend
echo "🎨 Starting Frontend..."
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started with PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 5

# Check if frontend is running
if check_port 3000; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend failed to start"
    exit 1
fi

echo ""
echo "🎉 BlockDAG Smart Wallet is now running!"
echo ""
echo "📊 Services:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:4000"
echo ""
echo "📝 Logs:"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop all services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Process IDs saved to: .pids"
echo "$BACKEND_PID $FRONTEND_PID" > .pids
