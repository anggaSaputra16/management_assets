@echo off
echo ===============================================
echo  Docker Desktop Force Restart Script
echo ===============================================
echo.

echo [1/6] Stopping all running containers...
docker stop $(docker ps -aq) 2>nul

echo [2/6] Removing all containers...
docker rm $(docker ps -aq) 2>nul

echo [3/6] Removing all volumes...
docker volume prune -f 2>nul

echo [4/6] Stopping Docker Desktop...
taskkill /f /im "Docker Desktop.exe" 2>nul
taskkill /f /im "dockerd.exe" 2>nul
taskkill /f /im "com.docker.backend.exe" 2>nul
taskkill /f /im "com.docker.cli.exe" 2>nul
timeout /t 5 /nobreak >nul

echo [5/6] Killing lingering Docker processes...
wmic process where "name='dockerd.exe'" delete 2>nul
wmic process where "name='docker.exe'" delete 2>nul
wmic process where "name='com.docker.backend.exe'" delete 2>nul
wmic process where "name='com.docker.cli.exe'" delete 2>nul

echo [6/6] Starting Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo.
echo Waiting for Docker Desktop to start completely...
timeout /t 30 /nobreak >nul

echo.
echo ===============================================
echo Docker Desktop restart completed!
echo Please wait a moment for full initialization
echo ===============================================
echo.
pause