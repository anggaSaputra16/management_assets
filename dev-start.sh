#!/bin/bash

# Development mode script for Management Assets System

echo "🚀 Starting Management Assets System in Development Mode..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📋 Note: This will run with mock data. For full functionality, setup PostgreSQL database."

# Navigate to backend directory and start backend
echo "🔧 Starting Backend API..."
cd "$(dirname "$0")/backend"
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Navigate to frontend directory and start frontend
echo "🎨 Starting Frontend Application..."
cd "../frontend"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 10

echo ""
echo "🎉 Management Assets System is running!"
echo ""
echo "📱 Frontend URL: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000/api"
echo "🏥 Backend Health: http://localhost:5000/api/health"
echo ""
echo "📋 Login credentials (mock data):"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🛑 To stop services:"
echo "   Press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Services stopped."
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for user input
echo "🌐 Opening browser..."
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi

echo "Press Ctrl+C to stop all services..."
wait
