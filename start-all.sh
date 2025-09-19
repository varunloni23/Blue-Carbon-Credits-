#!/bin/bash

# Blue Carbon MRV System - Complete Startup Script
# Starts all three main components

echo "🌊 Starting Blue Carbon MRV System..."
echo "=================================="

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check required ports
check_port 5000 || echo "Main backend may already be running"
check_port 3001 || echo "Admin dashboard may already be running" 
check_port 3000 || echo "User app frontend may already be running"
check_port 8000 || echo "User app backend may already be running"

echo ""
echo "Starting components..."

# 1. Start Main Backend (Blockchain Server)
echo "🔧 Starting Main Backend (Blockchain Server)..."
cd backend
npm install --silent 2>/dev/null || true
npm start &
BACKEND_PID=$!
cd ..
sleep 3

# 2. Start Admin Dashboard  
echo "👨‍💼 Starting Admin Dashboard..."
cd admin-dashboard
npm install --silent 2>/dev/null || true
PORT=3001 npm start &
ADMIN_PID=$!
cd ..
sleep 3

# 3. Start User Application Backend
echo "🐍 Starting User App Backend (Python)..."
cd python-app/backend
python3 simple_server.py &
USER_BACKEND_PID=$!
cd ../..
sleep 2

# 4. Start User Application Frontend
echo "📱 Starting User App Frontend..."
cd python-app/frontend
npm install --silent 2>/dev/null || true
npm start &
USER_FRONTEND_PID=$!
cd ../..

echo ""
echo "🎉 Blue Carbon MRV System Started!"
echo "=================================="
echo ""
echo "📊 Main Backend (Blockchain):   http://localhost:5000"
echo "👨‍💼 Admin Dashboard (NCCR):      http://localhost:3001" 
echo "📱 User App Frontend:           http://localhost:3000"
echo "🐍 User App Backend API:        http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Trap to cleanup processes on exit
trap "echo '🛑 Shutting down all servers...'; kill $BACKEND_PID $ADMIN_PID $USER_BACKEND_PID $USER_FRONTEND_PID 2>/dev/null; exit" INT

# Keep script running
wait
