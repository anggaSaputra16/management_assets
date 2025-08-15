# Docker Development Setup dengan Hot Reload

## Overview

Project Asset Management System sekarang dapat dijalankan di Docker dengan fitur **real-time update** (hot reload). Setiap perubahan pada kode akan langsung terlihat tanpa perlu restart container.

## 📦 Containers yang Berjalan

### 1. **Database (PostgreSQL)**
- **Container**: `management-assets-db-dev`
- **Port**: `5432`
- **Service**: Database dengan data yang persisten

### 2. **Backend API (Node.js/Express)**
- **Container**: `management-assets-backend-dev`
- **Port**: `5000`
- **Features**:
  - 🔄 **Hot Reload**: Otomatis restart saat kode berubah
  - 📁 **Volume Mounting**: Source code di-mount ke container
  - 🗄️ **Database Migration**: Otomatis saat startup
  - 🌱 **Database Seeding**: Data sample otomatis

### 3. **Frontend (Next.js)**
- **Container**: `management-assets-frontend-dev`
- **Port**: `3000`
- **Features**:
  - ⚡ **Fast Refresh**: Update real-time untuk React components
  - 📁 **Volume Mounting**: Source code di-mount ke container
  - 🔧 **Webpack Polling**: File watching yang optimized untuk Docker

## 🚀 Cara Menjalankan

### Method 1: Script Otomatis (Recommended)
```batch
# Windows
.\dev-start-docker.bat

# Linux/Mac
./dev-start-docker.sh
```

### Method 2: Manual
```bash
# Stop container yang ada
docker-compose -f docker-compose.dev.yml down

# Build dan start development containers
docker-compose -f docker-compose.dev.yml up --build -d

# Lihat status
docker-compose -f docker-compose.dev.yml ps

# Lihat logs
docker-compose -f docker-compose.dev.yml logs -f
```

## 🌐 Akses Aplikasi

| Service | URL | Deskripsi |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | React/Next.js Application |
| **Backend API** | http://localhost:5000/api | REST API Endpoints |
| **Health Check** | http://localhost:5000/api/health | API Status |
| **Database** | localhost:5432 | PostgreSQL (Internal) |

## 🔄 Hot Reload Features

### Frontend (Next.js)
- **Fast Refresh**: React components update otomatis
- **CSS Hot Reload**: Styling changes langsung terlihat
- **TypeScript**: Type checking real-time
- **File Watching**: Polling-based untuk Docker compatibility

### Backend (Node.js)
- **Nodemon**: Otomatis restart saat file berubah
- **API Routes**: Update langsung saat edit endpoints
- **Database Schema**: Prisma generate otomatis
- **Environment Variables**: Reload otomatis

## 📁 Volume Mounting

```yaml
# Frontend
volumes:
  - ./frontend:/app          # Source code
  - /app/node_modules        # Node modules (exclude)
  - /app/.next              # Next.js build cache

# Backend  
volumes:
  - ./backend:/app           # Source code
  - /app/node_modules        # Node modules (exclude)
  - backend_uploads_dev:/app/uploads  # File uploads
```

## 🛠️ Development Workflow

### 1. Edit Code
- Edit file di host machine
- Changes langsung sync ke container
- Hot reload otomatis triggered

### 2. Add Dependencies
```bash
# Frontend
docker-compose -f docker-compose.dev.yml exec frontend npm install package-name

# Backend
docker-compose -f docker-compose.dev.yml exec backend npm install package-name
```

### 3. Database Operations
```bash
# Prisma commands
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev
docker-compose -f docker-compose.dev.yml exec backend npx prisma db seed
```

### 4. Debugging
```bash
# View logs
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f backend

# Execute commands in container
docker-compose -f docker-compose.dev.yml exec frontend bash
docker-compose -f docker-compose.dev.yml exec backend bash
```

## 🎯 Performance Optimizations

### 1. File Watching
- **Polling enabled** untuk Docker compatibility
- **Webpack configuration** dioptimasi untuk development
- **Chokidar polling** untuk cross-platform support

### 2. Caching
- **Node modules** di-exclude dari volume mounting
- **Next.js cache** dipertahankan dalam container
- **Build cache** untuk faster rebuilds

### 3. Health Checks
- Automatic container health monitoring
- Dependencies checking (database → backend → frontend)
- Graceful startup sequencing

## 🔧 Configuration Files

### Docker Compose
- `docker-compose.dev.yml` - Development setup dengan hot reload
- `docker-compose.yml` - Production setup

### Dockerfiles
- `frontend/Dockerfile.dev` - Frontend development container
- `backend/Dockerfile.dev` - Backend development container

### Next.js Config
```typescript
// next.config.ts
webpack: (config, { dev, isServer }) => {
  if (dev && !isServer) {
    config.watchOptions = {
      poll: 1000,          // Check for changes every 1 second
      aggregateTimeout: 300, // Delay before rebuilding
    };
  }
  return config;
}
```

## 🛑 Stop & Cleanup

```bash
# Stop containers
docker-compose -f docker-compose.dev.yml down

# Stop dan hapus volumes
docker-compose -f docker-compose.dev.yml down -v

# Cleanup images
docker system prune -a
```

## 🎉 Benefits

✅ **Konsisten Environment**: Docker memastikan environment yang sama di semua machine  
✅ **Fast Development**: Hot reload untuk feedback loop yang cepat  
✅ **Easy Setup**: One command untuk start seluruh stack  
✅ **Isolated Dependencies**: Tidak perlu install Node.js/PostgreSQL di host  
✅ **Production-like**: Environment mendekati production setup  
✅ **Team Collaboration**: Setup yang sama untuk semua developer  

## 🔍 Troubleshooting

### Hot Reload Tidak Berfungsi
```bash
# Check file watching
docker-compose -f docker-compose.dev.yml logs frontend | grep "compiled"

# Restart containers
docker-compose -f docker-compose.dev.yml restart frontend
```

### Database Connection Error
```bash
# Check database status
docker-compose -f docker-compose.dev.yml logs postgres

# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Port Already in Use
```bash
# Kill processes using ports
npx kill-port 3000 5000 5432

# Or use different ports in docker-compose.dev.yml
```

---

🎯 **Ready to develop!** Aplikasi sekarang berjalan dengan Docker + Hot Reload untuk development experience yang optimal!
