#!/bin/bash

# Blue Carbon MRV System - Quick Start Script

echo "🌊 Starting Blue Carbon MRV System..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Python and Node.js found"

# Start backend server
echo "🚀 Starting FastAPI backend server..."
cd backend
python3 -m pip install --user fastapi uvicorn python-multipart web3 pydantic 2>/dev/null || true
python3 main.py &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend development server
echo "🌐 Starting React frontend..."
cd frontend
npm install 2>/dev/null || echo "⚠️  npm install failed, continuing..."
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Blue Carbon MRV System is starting up!"
echo ""
echo "📱 Frontend (React): http://localhost:3000"
echo "🔧 Backend (FastAPI): http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for interrupt signal
trap "echo '🛑 Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Keep script running
wait
