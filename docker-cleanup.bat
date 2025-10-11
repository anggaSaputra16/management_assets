@echo off
echo ========================================
echo Docker Cleanup and Restart Script
echo ========================================

echo.
echo 1. Stopping Docker Desktop...
taskkill /f /im "Docker Desktop.exe" 2>nul
taskkill /f /im "com.docker.backend.exe" 2>nul
taskkill /f /im "com.docker.build.exe" 2>nul
timeout /t 5 /nobreak > nul

echo.
echo 2. Cleaning up Docker processes...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq docker*" /fo table /nh 2^>nul') do (
    if not "%%i"=="INFO:" taskkill /f /pid %%i 2>nul
)

echo.
echo 3. Starting Docker Desktop...
start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"

echo.
echo 4. Waiting for Docker to start (60 seconds)...
timeout /t 60 /nobreak > nul

echo.
echo 5. Testing Docker connection...
docker version
if %ERRORLEVEL% NEQ 0 (
    echo Docker is not ready yet. Please wait and try again.
    pause
    exit /b 1
)

echo.
echo 6. Cleaning up any leftover containers...
docker container prune -f
docker image prune -f
docker volume prune -f
docker system prune -f

echo.
echo ========================================
echo Docker cleanup completed successfully!
echo ========================================
pause