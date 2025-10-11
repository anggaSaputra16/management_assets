# Docker Desktop Force Restart Script (PowerShell)
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Docker Desktop Force Restart Script" -ForegroundColor Cyan  
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "[1/7] Attempting to stop all running containers..." -ForegroundColor Yellow
    try { docker stop $(docker ps -aq) } catch { Write-Host "No containers to stop or Docker not running" -ForegroundColor Gray }
    
    Write-Host "[2/7] Removing all containers..." -ForegroundColor Yellow
    try { docker rm $(docker ps -aq) } catch { Write-Host "No containers to remove" -ForegroundColor Gray }
    
    Write-Host "[3/7] Cleaning up volumes and networks..." -ForegroundColor Yellow
    try { docker volume prune -f } catch { Write-Host "Volume cleanup skipped" -ForegroundColor Gray }
    try { docker network prune -f } catch { Write-Host "Network cleanup skipped" -ForegroundColor Gray }
    
    Write-Host "[4/7] Stopping Docker Desktop processes..." -ForegroundColor Yellow
    $dockerProcesses = @(
        "Docker Desktop", 
        "dockerd", 
        "com.docker.backend", 
        "com.docker.cli",
        "Docker Desktop Installer"
    )
    
    foreach ($process in $dockerProcesses) {
        try {
            Get-Process -Name $process -ErrorAction SilentlyContinue | Stop-Process -Force
            Write-Host "Stopped: $process" -ForegroundColor Green
        }
        catch {
            Write-Host "Process not found: $process" -ForegroundColor Gray
        }
    }
    
    Write-Host "[5/7] Waiting for processes to terminate..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "[6/7] Force killing any remaining Docker processes..." -ForegroundColor Yellow
    # Kill by PID if specific processes are known to be problematic
    $problematicPIDs = @(389, 6796, 14204, 20320, 26276)
    foreach ($pid in $problematicPIDs) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Killed PID: $pid" -ForegroundColor Green
        }
        catch {
            Write-Host "PID not found or already terminated: $pid" -ForegroundColor Gray
        }
    }
    
    Write-Host "[7/7] Starting Docker Desktop..." -ForegroundColor Yellow
    $dockerDesktopPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerDesktopPath) {
        Start-Process $dockerDesktopPath
        Write-Host "Docker Desktop started successfully" -ForegroundColor Green
    }
    else {
        Write-Host "Docker Desktop not found at expected path" -ForegroundColor Red
        Write-Host "Please start Docker Desktop manually" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "Docker Desktop restart completed!" -ForegroundColor Green
    Write-Host "Please wait 30-60 seconds for full initialization" -ForegroundColor Yellow
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
catch {
    Write-Host "An error occurred: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}