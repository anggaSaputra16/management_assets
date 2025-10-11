@echo off
echo ===============================================
echo  Asset Management System - Docker Development
echo ===============================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker is not running or not accessible.
    echo.
    echo Solutions:
    echo 1. Start Docker Desktop manually
    echo 2. Run docker-force-restart.bat to reset Docker
    echo 3. Restart your computer if issues persist
    echo.
    pause
    exit /b 1
)

echo [1/4] Docker is running - proceeding with setup...

REM Stop any existing containers from this project
echo [2/4] Stopping existing containers and cleaning up...
docker-compose -f docker-compose.dev.yml down --remove-orphans 2>nul
docker volume prune -f >nul 2>&1

REM Build and start the development environment
echo [3/4] Building and starting optimized development environment...
echo This may take a few minutes on first run...
echo (CPU and memory limits applied to prevent performance issues)
echo.
docker-compose -f docker-compose.dev.yml up --build -d

REM Wait and check status
echo [4/4] Waiting for services to initialize...
timeout /t 15 /nobreak >nul

echo.
echo Container Status:
docker-compose -f docker-compose.dev.yml ps

echo.
echo ===============================================
echo  Development Environment Ready!
echo ===============================================
echo.
echo 🔥 Hot Reload Features:
echo • Frontend: Edit files in /frontend/src - changes auto-refresh
echo • Backend: Edit files in /backend/src - nodemon restarts automatically  
echo • Database: Changes persist in Docker volume
echo.
echo 📊 Services Available:
echo • Frontend:      http://localhost:3000
echo • Backend API:   http://localhost:5000/api
echo • Health Check:  http://localhost:5000/api/health
echo • Database:      localhost:5432
echo.
echo 🛠️ Useful Commands:
echo • View logs:     docker-compose -f docker-compose.dev.yml logs -f [service]
echo • Stop services: docker-compose -f docker-compose.dev.yml down
echo • Restart:       docker-compose -f docker-compose.dev.yml restart [service]
echo • Force cleanup: docker-force-restart.bat
echo.

REM Ask if user wants to open the application
set /p "openApp=Open application in browser? (y/n): "
if /i "%openApp%"=="y" (
    echo Opening application...
    timeout /t 2 /nobreak >nul
    start http://localhost:3000
    start http://localhost:5000/api/health
)

echo.
echo Development environment is ready! 🚀
echo Resource limits applied to prevent high CPU usage.
pause
