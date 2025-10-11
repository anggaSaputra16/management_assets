#!/bin/bash

echo "===================================="
echo "Starting Management Assets System"
echo "Development Mode with Hot Reload"
echo "===================================="

echo ""
echo "Cleaning up previous containers and volumes..."
docker-compose -f docker-compose.dev.yml down -v

echo ""
echo "Building and starting development containers..."
docker-compose -f docker-compose.dev.yml up --build -d

echo ""
echo "Containers are starting up..."
echo "This may take a few minutes for the first run."
echo "Hot reload is enabled - your changes will be reflected automatically!"
echo ""

echo "Waiting for services to be ready..."
sleep 10

echo ""
echo "Checking container status:"
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "===================================="
echo "Services are available at:"
echo "===================================="
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000/api"
echo "Backend Health: http://localhost:5000/api/health"
echo "Database: localhost:5432"
echo "===================================="
echo ""
echo "🔥 Hot Reload Features:"
echo "• Frontend: Edit files in /frontend/src - changes auto-refresh"
echo "• Backend: Edit files in /backend/src - nodemon restarts automatically"  
echo "• Database: Changes persist in Docker volume"
echo ""
echo "📊 Useful Commands:"
echo "• View logs: docker-compose -f docker-compose.dev.yml logs -f [service]"
echo "• Stop all: docker-compose -f docker-compose.dev.yml down"
echo "• Restart service: docker-compose -f docker-compose.dev.yml restart [service]"
echo ""
echo "Hot reload development environment is ready! 🚀"
