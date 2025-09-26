# Management Assets System - Setup Guide

## Architecture

This system runs with:
- **Database**: PostgreSQL in Docker container
- **Backend**: Node.js/Express/Prisma (manual)
- **Frontend**: Next.js/React (manual)

## Quick Start

### Option 1: Automated Setup
```bash
# Run the complete setup script
./setup-and-run.bat
```

### Option 2: Manual Setup

1. **Start Database Only**
   ```bash
   # Start PostgreSQL in Docker
   ./start-db-only.bat
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   npx prisma db push --accept-data-loss
   node prisma/seed-simple.js
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **pgAdmin**: http://localhost:8080
  - Email: admin@admin.com
  - Password: admin123

## Test Credentials

| Role | Email | Password | Employee Number |
|------|-------|----------|----------------|
| Admin | admin@company.com | password123 | EMP001 |
| Asset Admin | asset.admin@company.com | password123 | EMP002 |
| IT Manager | it.manager@company.com | password123 | EMP003 |
| Finance Manager | finance.manager@company.com | password123 | EMP004 |

## Database Connection

```
Host: localhost
Port: 5432
Database: management_assets
Username: postgres
Password: postgres123
URL: postgresql://postgres:postgres123@localhost:5432/management_assets
```

## Features Available

### ✅ Master Data Management
- **Companies**: Multi-company support with isolation
- **Departments**: Department management per company
- **Positions**: Job positions and levels
- **Categories**: Asset categories and hierarchies
- **Locations**: Physical locations and areas
- **Vendors**: Supplier and vendor management
- **Spare Parts**: Inventory and spare parts
- **Software Assets**: License and software management

### ✅ Asset Management
- Asset registration and tracking
- Asset transfers between locations/users
- Asset depreciation calculations
- QR code generation and scanning
- Asset specifications and documentation

### ✅ User & Role Management
- Role-based access control (RBAC)
- Multi-company user isolation
- Employee number tracking
- Department assignments

### ✅ System Features
- REST API with comprehensive endpoints
- JWT authentication and authorization
- Database migrations and seeding
- File upload handling
- Error handling and logging

## Development Commands

### Backend Commands
```bash
cd backend

# Development
npm run dev              # Start development server
npm run start           # Start production server

# Database
npx prisma db push      # Push schema to database
npx prisma generate     # Generate Prisma client
npx prisma studio       # Open Prisma Studio
node prisma/seed-simple.js  # Seed basic data

# Migration
npx prisma migrate dev  # Create and apply migration
npx prisma migrate reset  # Reset database
```

### Frontend Commands
```bash
cd frontend

# Development
npm run dev             # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run linter
```

### Docker Commands
```bash
# Database only
docker-compose -f docker-compose.db-only.yml up -d     # Start database
docker-compose -f docker-compose.db-only.yml down      # Stop database
docker-compose -f docker-compose.db-only.yml logs -f   # View logs

# Database management
docker exec -it management-assets-db psql -U postgres -d management_assets
```

## Project Structure

```
management-assets/
├── backend/
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Authentication, validation
│   │   └── index.js         # Main server file
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Database migrations
│   │   └── seed-simple.js   # Data seeding
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── components/      # Reusable components
│   │   ├── stores/          # Zustand state management
│   │   └── lib/            # Utilities and services
│   └── package.json
├── docker-compose.db-only.yml  # Database container
├── setup-and-run.bat          # Complete setup script
├── start-db-only.bat          # Database only script
└── stop-all.bat               # Stop all services
```

## Troubleshooting

### Database Issues
```bash
# Reset database completely
docker-compose -f docker-compose.db-only.yml down -v
docker-compose -f docker-compose.db-only.yml up -d
cd backend
npx prisma db push --accept-data-loss
node prisma/seed-simple.js
```

### Port Conflicts
- Frontend default: 3000 (change in package.json)
- Backend default: 5000 (change in .env)
- Database default: 5432 (change in docker-compose)
- pgAdmin default: 8080 (change in docker-compose)

### Common Errors
1. **"Missing script dev"**: Make sure you're in the right directory (backend/frontend)
2. **Database connection failed**: Ensure PostgreSQL container is running
3. **Port already in use**: Stop existing processes or change ports
4. **Migration failed**: Reset database and run setup again

## Stop All Services

```bash
# Use the stop script
./stop-all.bat

# Or manually:
# 1. Close Backend terminal (Ctrl+C)
# 2. Close Frontend terminal (Ctrl+C)
# 3. Stop database: docker-compose -f docker-compose.db-only.yml down
```

## Next Steps

1. **Login** to the system using test credentials
2. **Create master data** through the management interface
3. **Register assets** and test asset management flows
4. **Configure company-specific** settings and roles
5. **Customize** the system according to your requirements

## Support

For issues and questions:
1. Check this documentation
2. Review error logs in terminal windows
3. Use pgAdmin to inspect database
4. Check API endpoints at http://localhost:5000/api