@echo off
echo ========================================
echo   Management Assets - Manual Start
echo ========================================
echo.

echo 🔍 Checking if database is running...
docker-compose -f docker-compose.db-only.yml ps | findstr "postgres" > nul
if errorlevel 1 (
    echo ❌ Database is not running. Starting database first...
    call start-db-only.bat
    timeout /t 15 /nobreak > nul
) else (
    echo ✅ Database is already running
)

echo.
echo 📦 Installing dependencies...
echo.

echo 🔧 Backend dependencies...
cd backend
if not exist node_modules (
    echo Installing backend packages...
    npm install
)

echo.
echo 🎨 Frontend dependencies...
cd ..\frontend
if not exist node_modules (
    echo Installing frontend packages...
    npm install
)

echo.
echo 🗄️ Setting up database...
cd ..\backend
echo Running Prisma migrations...
npx prisma migrate dev --name init
echo.
echo Generating Prisma client...
npx prisma generate
echo.
echo Running database seed...
npx prisma db seed

echo.
echo ========================================
echo   Starting Applications
echo ========================================
echo.

echo 🚀 Both services will start in new terminal windows...
echo.

echo Starting Backend (Port 5001)...
start "Management Assets Backend" cmd /k "cd /d %cd% && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend (Port 3001)...
cd ..\frontend
start "Management Assets Frontend" cmd /k "cd /d %cd% && npm run dev"

echo.
echo ========================================
echo   Applications Started
echo ========================================
echo.
echo 🌐 Access URLs:
echo   Frontend: http://localhost:3001
echo   Backend API: http://localhost:5001/api
echo   pgAdmin: http://localhost:8080
echo.
echo 🔐 Default Login:
echo   Email: admin@company.com
echo   Password: password123
echo.
echo 📊 Services Status:
echo   ✅ Database: Running in Docker
echo   ✅ Backend: Running manually (Port 5001)
echo   ✅ Frontend: Running manually (Port 3001)
echo.
echo ❌ To stop: Close the terminal windows and run:
echo    docker-compose -f docker-compose.db-only.yml down
echo.

pause