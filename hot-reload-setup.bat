@echo off
echo ====================================
echo Rebuilding Management Assets System
echo Enabling Optimized Hot Reload
echo ====================================

echo.
echo Stopping any existing containers...
docker-compose -f docker-compose.dev.yml down

echo.
echo Building containers with hot reload optimization...
docker-compose -f docker-compose.dev.yml up --build -d

echo.
echo Containers are starting up...
echo This may take a few minutes for the first run.
echo.

echo Checking container status:
timeout /t 15 /nobreak > nul
docker-compose -f docker-compose.dev.yml ps

echo.
echo ====================================
echo Hot Reload Setup Complete!
echo ====================================
echo Frontend: http://localhost:3002
echo Backend API: http://localhost:5000/api
echo Database: localhost:5432
echo ====================================
echo.
echo Now you can edit files without manual container restarts!
echo Changes should be detected automatically within seconds.
echo.
echo To view logs: docker-compose -f docker-compose.dev.yml logs -f
echo To stop: docker-compose -f docker-compose.dev.yml down
echo.

pause