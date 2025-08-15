@echo off
REM Development mode script for Management Assets System

echo 🚀 Starting Management Assets System in Development Mode...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if PostgreSQL is running (optional - can use mock data)
echo 📋 Note: This will run with mock data. For full functionality, setup PostgreSQL database.

echo 🔧 Starting Backend API...
start "Backend API" cmd /k "cd /d c:\Users\LENOVO\Documents\development\management-assets\backend && npm run dev"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo 🎨 Starting Frontend Application...
start "Frontend App" cmd /k "cd /d c:\Users\LENOVO\Documents\development\management-assets\frontend && npm run dev"

echo ⏳ Waiting for frontend to start...
timeout /t 10 /nobreak >nul

echo.
echo 🎉 Management Assets System is starting!
echo.
echo 📱 Frontend URL: http://localhost:3000
echo 🔧 Backend API: http://localhost:5000/api
echo 🏥 Backend Health: http://localhost:5000/api/health
echo.
echo 📋 Login credentials (mock data):
echo    Username: admin
echo    Password: admin123
echo.
echo 🛑 To stop services:
echo    Close the terminal windows or press Ctrl+C in each
echo.

REM Wait a bit more and try to open browser
timeout /t 5 /nobreak >nul
echo 🌐 Opening browser...
start http://localhost:3000

pause
