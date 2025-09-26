#!/bin/bash

echo "========================================"
echo "   Management Assets - Manual Start"
echo "========================================"
echo ""

echo "🔍 Checking if database is running..."
if ! docker-compose -f docker-compose.db-only.yml ps | grep -q "postgres"; then
    echo "❌ Database is not running. Starting database first..."
    ./start-db-only.sh
    sleep 15
else
    echo "✅ Database is already running"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

echo "🔧 Backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend packages..."
    npm install
fi

echo ""
echo "🎨 Frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend packages..."
    npm install
fi

echo ""
echo "🗄️ Setting up database..."
cd ../backend
echo "Running Prisma migrations..."
npx prisma migrate dev --name init
echo ""
echo "Generating Prisma client..."
npx prisma generate
echo ""
echo "Running database seed..."
npx prisma db seed

echo ""
echo "========================================"
echo "   Starting Applications"
echo "========================================"
echo ""

echo "🚀 Starting Backend (Port 5000)..."
gnome-terminal --title="Management Assets Backend" -- bash -c "cd $(pwd) && npm run dev; exec bash" &

sleep 3

echo "🚀 Starting Frontend (Port 3001)..."
cd ../frontend
gnome-terminal --title="Management Assets Frontend" -- bash -c "cd $(pwd) && npm run dev; exec bash" &

echo ""
echo "========================================"
echo "   Applications Started"
echo "========================================"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:3001"
echo "   Backend API: http://localhost:5000/api"
echo "   pgAdmin: http://localhost:8080"
echo ""
echo "🔐 Default Login:"
echo "   Email: admin@company.com"
echo "   Password: password123"
echo ""
echo "📊 Services Status:"
echo "   ✅ Database: Running in Docker"
echo "   ✅ Backend: Running manually (Port 5000)"
echo "   ✅ Frontend: Running manually (Port 3001)"
echo ""
echo "❌ To stop: Close the terminal windows and run:"
echo "    docker-compose -f docker-compose.db-only.yml down"
echo ""