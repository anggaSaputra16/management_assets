# 🚀 Development Environment - Hot Reload Enabled

This project is configured with **Docker hot-reload** for rapid development without rebuilding containers.

## 🔥 Quick Start

### Windows
```batch
# Start development environment
.\dev-start-docker.bat

# Or use helper commands
.\dev-helper.bat start
```

### Linux/macOS
```bash
# Start development environment
./dev-start-docker.sh

# Or use helper commands
./dev-helper.sh start
```

## ⚡ Hot Reload Features

### ✅ What Updates Automatically:
- **Frontend** (`/frontend/src`): Next.js with Turbopack - instant refresh
- **Backend** (`/backend/src`): Nodemon restarts on file changes
- **Database**: Schema changes via Prisma migrations
- **Environment Variables**: Restart required

### 🚫 What Requires Rebuild:
- Package.json changes (dependencies)
- Dockerfile changes
- Docker Compose configuration changes

## 🛠️ Development Commands

| Command | Description | Example |
|---------|-------------|---------|
| `start` | Start all services | `dev-helper.bat start` |
| `stop` | Stop all services | `dev-helper.bat stop` |
| `restart` | Restart all services | `dev-helper.bat restart` |
| `logs` | View logs | `dev-helper.bat logs backend` |
| `ps` | Container status | `dev-helper.bat ps` |
| `clean` | Full cleanup | `dev-helper.bat clean` |

## 📊 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js Application |
| Backend | http://localhost:5000/api | Express API |
| Health Check | http://localhost:5000/api/health | API Status |
| Database | localhost:5432 | PostgreSQL |

## 🐛 Troubleshooting

### Hot Reload Not Working?
1. **Check file permissions**: Files should be writable
2. **Verify volume mounts**: `docker-compose ps` shows volumes
3. **File watcher limits**: Increase system limits if needed
4. **Container logs**: `docker-compose logs -f [service]`

### Performance Issues?
```bash
# Clean up unused Docker resources
dev-helper.bat clean

# Or manually
docker system prune -f
docker volume prune -f
```

### Port Conflicts?
```bash
# Check what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill processes
taskkill /PID [process_id] /F
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `docker-compose.dev.yml` | Development environment |
| `backend/nodemon.json` | Backend hot-reload config |
| `backend/Dockerfile.dev` | Backend development container |
| `frontend/Dockerfile.dev` | Frontend development container |

## 📝 Development Workflow

1. **Start Environment**: `.\dev-start-docker.bat`
2. **Edit Code**: Changes reflect automatically
3. **View Logs**: `dev-helper.bat logs [service]` 
4. **Debug**: Use container logs and browser dev tools
5. **Test**: API tests via Postman/curl
6. **Stop**: `dev-helper.bat stop`

## 🚨 Important Notes

- **First run**: Takes 2-3 minutes (database setup + deps install)
- **Subsequent runs**: ~30 seconds startup
- **File changes**: Instant frontend, ~2-5s backend restart
- **Database**: Persistent across container restarts
- **Uploads**: Persistent in Docker volume

---

Happy coding! 🎉 Hot reload makes development blazing fast! ⚡