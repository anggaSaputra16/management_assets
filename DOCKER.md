# Management Assets System - Docker Deployment Guide

## 🐳 Docker Setup untuk Management Assets System

Sistem ini telah dikonfigurasi untuk berjalan dengan Docker dan Docker Compose, memudahkan deployment dan pengelolaan environment.

## 📋 Prerequisites

1. **Docker Desktop** (Windows/Mac) atau **Docker Engine** (Linux)
2. **Docker Compose** (biasanya sudah termasuk dengan Docker Desktop)
3. **Git** untuk clone repository
4. Minimal **4GB RAM** dan **10GB disk space**

## 🚀 Quick Start

### Windows
```bash
# Clone repository
git clone <repository-url>
cd management-assets

# Jalankan deployment script
deploy.bat
```

### Linux/Mac
```bash
# Clone repository
git clone <repository-url>
cd management-assets

# Make script executable
chmod +x deploy.sh

# Jalankan deployment script
./deploy.sh
```

### Manual Docker Compose
```bash
# Build dan start semua services
docker-compose up --build -d

# Lihat status containers
docker-compose ps

# Lihat logs
docker-compose logs -f
```

## 🏗️ Arsitektur Docker

### Services yang Dijalankan:

1. **PostgreSQL Database** (Port 5432)
   - Container: `management-assets-db`
   - Database: `management_assets`
   - User: `postgres`
   - Password: `postgres123`

2. **Backend API** (Port 5000)
   - Container: `management-assets-backend`
   - Node.js + Express + Prisma
   - Auto migration dan seeding

3. **Frontend Application** (Port 3000)
   - Container: `management-assets-frontend`
   - Next.js dengan production build

4. **Nginx Reverse Proxy** (Port 80)
   - Container: `management-assets-nginx`
   - Load balancing dan SSL termination
   - Rate limiting dan security headers

## 🔧 Konfigurasi Environment

### Backend Environment (`.env.docker`)
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/management_assets
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
UPLOAD_PATH=/app/uploads
```

### Frontend Environment (`.env.docker`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_UPLOAD_URL=http://localhost:5000/uploads
```

## 📁 Volume Mapping

- **Database Data**: `postgres_data:/var/lib/postgresql/data`
- **File Uploads**: `backend_uploads:/app/uploads`
- **Nginx Config**: `./nginx/nginx.conf:/etc/nginx/nginx.conf`

## 🌐 Endpoint Access

Setelah deployment berhasil:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health
- **Nginx Proxy**: http://localhost:80
- **Database**: localhost:5432

## 📊 Monitoring & Logs

### Melihat Logs
```bash
# Semua services
docker-compose logs -f

# Service tertentu
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Logs realtime
docker-compose logs -f --tail=100
```

### Health Checks
```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend health
curl http://localhost:3000

# Database connection
docker-compose exec postgres pg_isready -U postgres
```

## 🛠️ Development Commands

### Service Management
```bash
# Start semua services
docker-compose up -d

# Stop semua services
docker-compose down

# Restart service tertentu
docker-compose restart backend
docker-compose restart frontend

# Rebuild service
docker-compose up --build backend
```

### Database Operations
```bash
# Access database shell
docker-compose exec postgres psql -U postgres -d management_assets

# Run Prisma commands
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

### Container Management
```bash
# Lihat running containers
docker-compose ps

# Execute command dalam container
docker-compose exec backend npm run dev
docker-compose exec frontend npm run build

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
```

## 🔒 Security Configuration

### Nginx Security Headers
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Content-Security-Policy: default-src 'self'

### Rate Limiting
- API Endpoints: 10 requests/second
- Login Endpoint: 5 requests/minute
- File Uploads: 50MB max size

### Network Security
- Isolated Docker network
- No direct database access from outside
- Backend only accessible through Nginx proxy

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :5000
   
   # Stop conflicting services
   docker-compose down
   ```

2. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose exec postgres pg_isready -U postgres
   
   # Restart database
   docker-compose restart postgres
   ```

3. **Build Failures**
   ```bash
   # Clean build cache
   docker system prune -f
   docker-compose build --no-cache
   ```

4. **Memory Issues**
   ```bash
   # Check Docker memory usage
   docker stats
   
   # Increase Docker memory limit in Docker Desktop
   ```

### Debug Mode
```bash
# Run dengan debug logs
docker-compose up --build

# Check container logs dengan timestamp
docker-compose logs -f -t backend
```

## 📈 Performance Optimization

### Production Settings
- Enable Nginx gzip compression
- Configure database connection pooling
- Set up Redis for session storage
- Enable container resource limits

### Scaling
```bash
# Scale specific services
docker-compose up --scale backend=3 --scale frontend=2
```

## 🔄 Backup & Restore

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres management_assets > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres management_assets < backup.sql
```

### Volume Backup
```bash
# Backup volumes
docker run --rm -v management-assets_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## 🚀 Production Deployment

### Environment Variables untuk Production
1. Ganti semua secret keys
2. Konfigurasi email SMTP yang valid
3. Setup SSL certificates
4. Konfigurasi domain dan DNS
5. Setup monitoring dan logging

### SSL Configuration
1. Uncomment SSL section di `nginx/nginx.conf`
2. Add SSL certificates ke `nginx/ssl/`
3. Update domain configuration

### Environment Setup
```bash
# Production environment
cp .env.docker .env.production
# Edit file dengan konfigurasi production
```

## 📞 Support

Jika mengalami masalah:
1. Check logs dengan `docker-compose logs -f`
2. Verify port availability
3. Check Docker resources (memory, disk)
4. Restart services dengan `docker-compose restart`
5. Full rebuild dengan `docker-compose up --build --force-recreate`

## 🎯 Next Steps

Setelah deployment berhasil:
1. Login dengan admin credentials
2. Setup master data (categories, locations, departments)
3. Import users dan assets
4. Configure email notifications
5. Setup backup schedule
6. Monitor system performance
