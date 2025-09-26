@echo off
echo ========================================
echo   Management Assets - Database Only
echo ========================================
echo.

echo 🐳 Starting PostgreSQL database in Docker...
docker-compose -f docker-compose.db-only.yml up -d

echo.
echo 🔍 Checking database status...
timeout /t 10 /nobreak > nul

docker-compose -f docker-compose.db-only.yml ps

echo.
echo ========================================
echo   Database Setup Complete
echo ========================================
echo.
echo 🔗 Database Connection:
echo   Host: localhost
echo   Port: 5432
echo   Database: management_assets
echo   Username: postgres
echo   Password: postgres123
echo   URL: postgresql://postgres:postgres123@localhost:5432/management_assets
echo.
echo 🌐 pgAdmin (Database Management):
echo   URL: http://localhost:8080
echo   Email: admin@admin.com
echo   Password: admin123
echo.
echo 📚 Next Steps:
echo   1. Run backend: cd backend && npm run dev
echo   2. Run frontend: cd frontend && npm run dev
echo   3. Access app: http://localhost:3001
echo.
echo 🛑 To stop database: docker-compose -f docker-compose.db-only.yml down
echo ========================================

pause