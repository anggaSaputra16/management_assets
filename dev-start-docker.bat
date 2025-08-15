@echo off
echo ====================================
echo Starting Management Assets System
echo Development Mode with Hot Reload
echo ====================================

echo.
echo Stopping any existing containers...
docker-compose -f docker-compose.dev.yml down

echo.
echo Building and starting development containers...
docker-compose -f docker-compose.dev.yml up --build -d

echo.
echo Containers are starting up...
echo This may take a few minutes for the first run.
echo.

echo Checking container status:
timeout /t 5 /nobreak > nul
docker-compose -f docker-compose.dev.yml ps

echo.
echo ====================================
echo Services will be available at:
echo ====================================
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000/api
echo Database: localhost:5432
echo ====================================
echo.
echo To view logs: docker-compose -f docker-compose.dev.yml logs -f
echo To stop: docker-compose -f docker-compose.dev.yml down
echo.

pause
