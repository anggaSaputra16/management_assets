<#
PowerShell helper: use-external-db.ps1
- Tests TCP connectivity to the external DB
- Optionally runs prisma migrate deploy inside the backend folder
- Optionally restarts the backend docker container or runs the local dev server

Usage examples:
.
# Test only
pwsh> .\scripts\use-external-db.ps1 -Host "localhost" -Port 5433

# Test and run migrations (runs in backend folder)
pwsh> .\scripts\use-external-db.ps1 -Host "localhost" -Port 5433 -RunMigrations

# Test, run migrations, and restart the docker backend container
pwsh> .\scripts\use-external-db.ps1 -Host "localhost" -Port 5433 -RunMigrations -RestartBackendContainer
#>

param(
    [string]$Host = "localhost",
    [int]$Port = 5432,
    [switch]$RunMigrations,
    [switch]$RestartBackendContainer
n)

Write-Host "Testing TCP connectivity to $Host:$Port..."
$test = Test-NetConnection -ComputerName $Host -Port $Port -WarningAction SilentlyContinue
if ($test.TcpTestSucceeded) {
    Write-Host "TCP OK: $Host:$Port is reachable" -ForegroundColor Green
} else {
    Write-Host "TCP FAILED: $Host:$Port not reachable" -ForegroundColor Red
    Write-Host "If this is a remote DB, ensure firewall rules allow access and the DB listens on this interface."
    exit 1
}

# Optionally run prisma migrate deploy
if ($RunMigrations) {
    Write-Host "Running migrations (prisma migrate deploy) in backend..."
    Push-Location .\backend
    if (!(Test-Path -Path node_modules)) { Write-Host "Installing dependencies (npm install)..."; npm install }
    Write-Host "Generating Prisma client..."; npx prisma generate
    Write-Host "Applying migrations..."; npx prisma migrate deploy
    Pop-Location
}

# Optionally restart the backend container so it picks the env (if you're using docker)
if ($RestartBackendContainer) {
    Write-Host "Restarting backend docker container (management-assets-backend-dev)..."
    docker restart management-assets-backend-dev | Write-Host
}

Write-Host "Done."