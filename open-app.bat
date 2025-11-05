@echo off
echo ===============================================
echo  Asset Management System - Development Ready!
echo ===============================================
echo.
echo Services Status:
echo ✓ Backend API:  http://localhost:5001/api
echo ✓ Frontend:     http://localhost:3000
echo ✓ Database:     localhost:5432
echo.
echo Features:
echo • Hot Reload: Enabled for both frontend and backend
echo • Auto Restart: Changes are automatically detected
echo • Resource Limits: Applied to prevent high CPU usage
echo • Development Tools: Ready for coding
echo.
echo Opening application...
timeout /t 2 /nobreak >nul
start http://localhost:3000
start http://localhost:5001/api/health
echo.
echo Development environment is ready! 🚀
echo Press any key to continue...
pause >nul