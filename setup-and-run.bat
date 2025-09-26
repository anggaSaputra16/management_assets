@echo off
cls
echo ================================================================
echo    Management Assets System - Complete Setup
echo ================================================================
echo.

:: Check Docker
echo 🔍 Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed or not running.
    echo Please install Docker Desktop and try again.
    pause
    exit /b 1
)

:: Start Database
echo 🐳 Starting PostgreSQL database...
docker-compose -f docker-compose.db-only.yml up -d

:: Wait for database
echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak > nul

:: Setup Backend
echo 🔧 Setting up Backend...
cd backend

if not exist node_modules (
    echo Installing backend dependencies...
    npm install
)

echo Pushing database schema...
npx prisma db push --accept-data-loss

echo Seeding database...
node prisma/seed-simple.js

:: Setup Frontend  
echo 🎨 Setting up Frontend...
cd ..\frontend

if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)

echo.
echo ================================================================
echo    Starting Development Servers
echo ================================================================
echo.

:: Start Backend
echo 🚀 Starting Backend Server (Port 5000)...
start "Backend - Management Assets" cmd /k "cd /d %~dp0backend && npm run dev"

:: Wait a bit
timeout /t 3 /nobreak > nul

:: Start Frontend
echo 🎨 Starting Frontend Server (Port 3000)...
start "Frontend - Management Assets" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ================================================================
echo    Setup Complete!
echo ================================================================
echo.
echo 🌐 Application URLs:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000/api
echo   pgAdmin: http://localhost:8080 (admin@admin.com / admin123)
echo.
echo 🔐 Test Login Credentials:
echo   Admin: admin@company.com / password123
echo   Asset Admin: asset.admin@company.com / password123
echo   IT Manager: it.manager@company.com / password123
echo   Finance Manager: finance.manager@company.com / password123
echo.
echo 📊 Services Status:
echo   ✅ Database: Running in Docker (PostgreSQL)
echo   ✅ Backend: Running manually (Node.js/Express)
echo   ✅ Frontend: Running manually (Next.js)
echo.
echo ❌ To Stop All Services:
echo   1. Close the Backend and Frontend terminal windows
echo   2. Run: docker-compose -f docker-compose.db-only.yml down
echo   3. Or use: stop-all.bat
echo.
echo 💡 The application will open in your default browser...
timeout /t 5 /nobreak > nul
start http://localhost:3000

echo.
echo Happy coding! 🚀
pause