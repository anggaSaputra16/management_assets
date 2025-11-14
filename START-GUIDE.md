# 🚀 Simplified Start Guide

## Available Start Scripts

Setelah cleanup, tersisa script-script essential untuk development:

### 🐳 Docker Development (Recommended)

#### Start Full Stack with Docker
```bash
# Windows
.\start-dev-docker.bat

# Linux/Mac
./start-dev-docker.sh
```
**Services:**
- Frontend: http://localhost:3001
- Backend: http://localhost:5001
- PostgreSQL: localhost:5432

#### Start Database Only
```bash
# Windows
.\start-db-only.bat

# Linux/Mac  
./start-db-only.sh
```
**Services:**
- PostgreSQL: localhost:5432

### 💻 Manual Development

#### Backend (requires PostgreSQL running)
```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```
Server runs on: http://localhost:5001

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
Server runs on: http://localhost:3001

### 🛠️ Database Commands

```bash
cd backend

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Reset database (drop all, migrate, seed)
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

### 🛑 Stop All Services

```bash
# Windows
.\stop-all.bat

# Linux/Mac
./stop-all.sh
```

### 📦 Deployment

```bash
# Windows
.\deploy.bat

# Linux/Mac
./deploy.sh
```
Starts production build with Docker Compose.

## 📂 Project Structure

```
management-assets/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   ├── seed-complete.js      # ⭐ ONLY SEED FILE
│   │   ├── enum-backup.json      # Enum values backup
│   │   └── migrations/           # Migration history
│   ├── src/
│   │   ├── routes/               # API endpoints
│   │   ├── middleware/           # Auth, validation, etc
│   │   ├── utils/                # Helper functions
│   │   └── index.js              # Entry point
│   └── package.json
│
├── frontend/
│   ├── app/                      # Next.js pages
│   ├── components/               # React components
│   ├── lib/
│   │   └── services/             # API services
│   ├── stores/                   # Zustand state management
│   └── package.json
│
├── nginx/                        # Reverse proxy config
├── .github/
│   └── copilot-instructions.md   # AI agent guide
│
├── docker-compose.yml            # Production
├── docker-compose.dev.yml        # Development
├── docker-compose.db-only.yml    # Database only
│
├── start-dev-docker.bat/.sh      # ⭐ Start full dev
├── start-db-only.bat/.sh         # ⭐ Start DB only
├── stop-all.bat/.sh              # Stop services
├── deploy.bat/.sh                # Production deploy
│
├── README.md                     # Main documentation
└── SEED-GUIDE.md                 # Seeding documentation
```

## 🎯 Quick Start Development

### First Time Setup
```bash
# 1. Clone repository
git clone [repo-url]
cd management-assets

# 2. Copy environment files
cp .env.local .env

# 3. Start database
.\start-db-only.bat

# 4. Setup backend
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Setup frontend (new terminal)
cd frontend
npm install

# 6. Start dev servers
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

### Daily Development
```bash
# Option 1: Docker (easiest)
.\start-dev-docker.bat
# Wait for services to start, then access http://localhost:3001

# Option 2: Manual (better for debugging)
# Terminal 1: Start database
.\start-db-only.bat

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

## 🔐 Login Credentials

See [SEED-GUIDE.md](./SEED-GUIDE.md) for complete list.

**Quick access:**
- Admin: `admin@mjt.com` / `password123`
- Asset Admin: `asset.admin@mjt.com` / `password123`
- Manager: `manager@mjt.com` / `password123`

## 📚 Additional Documentation

- `README.md` - Main project documentation
- `SEED-GUIDE.md` - Database seeding detailed guide
- `.github/copilot-instructions.md` - AI agent development guide

## 🎨 Architecture Overview

**Backend:**
- Node.js + Express
- Prisma ORM + PostgreSQL
- JWT Authentication
- Role-Based Access Control (RBAC)

**Frontend:**
- Next.js 14 (App Router)
- Zustand (State Management)
- Tailwind CSS + Shadcn UI
- Axios (API calls)

**Deployment:**
- Docker + Docker Compose
- Nginx reverse proxy
- Hot-reload in development
- Production optimization

## ⚡ Performance Tips

1. **Docker Development**: Volume mounts enable hot-reload
2. **Database**: Use `db:studio` for visual data inspection
3. **Seed Data**: Run seed once, use same data across sessions
4. **TypeScript**: Frontend uses TypeScript for type safety

## 🐛 Troubleshooting

### Docker Issues
```bash
# Check Docker status
docker ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart services
docker-compose -f docker-compose.dev.yml restart

# Clean restart
docker-compose -f docker-compose.dev.yml down -v
.\start-dev-docker.bat
```

### Database Issues
```bash
# Reset database completely
cd backend
npm run db:reset

# Check connection
npm run db:studio
```

### Port Already in Use
```bash
# Find process using port (Windows)
netstat -ano | findstr :3001
netstat -ano | findstr :5001
netstat -ano | findstr :5432

# Kill process
taskkill /PID [PID] /F
```

## 📞 Support

Check `.github/copilot-instructions.md` for detailed development patterns and conventions.
