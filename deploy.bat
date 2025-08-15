@echo off
echo ================================
echo   ASSET MANAGEMENT DEPLOYMENT
echo ================================
echo.

echo Checking Docker installation...
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker and Docker Compose first
    pause
    exit /b 1
)

echo Checking Docker Compose...
docker compose version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker Compose is not available
    echo Please install Docker Compose
    pause
    exit /b 1
)

echo.
echo Stopping existing containers...
docker compose down

echo.
echo Removing old images (optional)...
set /p cleanup=Do you want to remove old images? (y/N): 
if /i "%cleanup%"=="y" (
    docker compose down --volumes --remove-orphans
    docker system prune -f
)

echo.
echo Building and starting services...
docker compose up --build -d

echo.
echo Waiting for services to be ready...
timeout /t 30 /nobreak

echo.
echo Checking service status...
docker compose ps

echo.
echo =================================
echo   DEPLOYMENT COMPLETE!
echo =================================
echo.
echo Services are running on:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:5000/api
echo - PostgreSQL: localhost:5432
echo - Nginx: http://localhost (if enabled)
echo.
echo To view logs: docker compose logs -f
echo To stop: docker compose down
echo.

set /p open=Open application in browser? (y/N): 
if /i "%open%"=="y" (
    start http://localhost:3000
)

pause
