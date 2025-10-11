@echo off
REM Quick development commands for Windows

if "%1"=="" goto help
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="clean" goto clean
if "%1"=="ps" goto ps
goto help

:start
echo Starting development environment...
docker-compose -f docker-compose.dev.yml up -d
goto end

:stop
echo Stopping development environment...
docker-compose -f docker-compose.dev.yml down
goto end

:restart
echo Restarting development environment...
docker-compose -f docker-compose.dev.yml restart
goto end

:logs
if "%2"=="" (
    echo Showing all logs...
    docker-compose -f docker-compose.dev.yml logs -f
) else (
    echo Showing logs for %2...
    docker-compose -f docker-compose.dev.yml logs -f %2
)
goto end

:clean
echo Cleaning up containers, volumes, and images...
docker-compose -f docker-compose.dev.yml down -v --rmi all
docker system prune -f
goto end

:ps
echo Container status:
docker-compose -f docker-compose.dev.yml ps
goto end

:help
echo Management Assets Development Helper
echo.
echo Usage: dev-helper.bat [command]
echo.
echo Commands:
echo   start     Start development environment
echo   stop      Stop development environment  
echo   restart   Restart all services
echo   logs      Show logs (optional: specify service name)
echo   clean     Clean up everything (containers, volumes, images)
echo   ps        Show container status
echo.
echo Examples:
echo   dev-helper.bat start
echo   dev-helper.bat logs backend
echo   dev-helper.bat clean

:end