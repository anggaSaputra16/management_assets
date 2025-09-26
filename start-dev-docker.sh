#!/bin/bash
echo "Starting Asset Management System in Docker with Hot Reload..."
echo

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

echo
echo "Starting all services (Database, Backend, Frontend)..."
docker-compose -f docker-compose.dev.yml up -d

echo
echo "Waiting for services to start..."
sleep 10

echo
echo "Checking service status..."
docker-compose -f docker-compose.dev.yml ps

echo
echo "====================================================="
echo " Asset Management System is starting up!"
echo "====================================================="
echo " Frontend:  http://localhost:3000"
echo " Backend:   http://localhost:5000/api"
echo " Database:  localhost:5432"
echo " Health:    http://localhost:5000/api/health"
echo "====================================================="
echo
echo "Default Login Credentials:"
echo " Email:     admin@company.com"
echo " Password:  password123"
echo
echo "To view logs: docker-compose -f docker-compose.dev.yml logs [service]"
echo "To stop all:  docker-compose -f docker-compose.dev.yml down"
echo
echo "Hot-reload is enabled for development!"
echo