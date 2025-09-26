@echo off
echo ========================================
echo   Management Assets - Stop Services
echo ========================================
echo.

echo 🛑 Stopping Docker database...
docker-compose -f docker-compose.db-only.yml down

echo.
echo 📋 Manual steps to stop backend and frontend:
echo   1. Close the Backend terminal window
echo   2. Close the Frontend terminal window
echo   3. Or press Ctrl+C in each terminal
echo.

echo 🔍 Checking for running Node processes...
tasklist /FI "IMAGENAME eq node.exe" | findstr "node.exe" > nul
if not errorlevel 1 (
    echo.
    echo ⚠️  Found running Node.js processes:
    tasklist /FI "IMAGENAME eq node.exe"
    echo.
    echo 💡 To force kill all Node processes (if needed):
    echo    taskkill /F /IM node.exe
) else (
    echo ✅ No Node.js processes found running
)

echo.
echo 🔍 Docker containers status:
docker-compose -f docker-compose.db-only.yml ps

echo.
echo ========================================
echo   Services Stopped
echo ========================================

pause