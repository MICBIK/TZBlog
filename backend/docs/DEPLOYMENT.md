# TZBlog Deployment Guide

## 📋 Prerequisites

- Docker & Docker Compose installed
- Domain name configured
- SSL certificate (Let's Encrypt recommended)
- Cloudflare R2 account (for media storage)

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/yourusername/TZBlog.git
cd TZBlog/backend

# Copy environment variables
cp .env.prod.example .env

# Edit .env with your values
nano .env
```

### 2. Configure Environment Variables

Edit `.env` file:

```bash
# Database
DB_USER=tzblog
DB_PASSWORD=your_secure_password_here
DB_NAME=tzblog_prod

# Redis
REDIS_PASSWORD=your_redis_password_here

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Base URL
BASE_URL=https://tzblog.com

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=tzblog-media
R2_PUBLIC_URL=https://media.tzblog.com
```

### 3. Deploy

```bash
# Make deploy script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh production
```

## 📊 Service Management

### Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Stop Services

```bash
docker-compose -f docker-compose.prod.yml down
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Restart Service

```bash
docker-compose -f docker-compose.prod.yml restart backend
```

## 🔄 Database Management

### Backup

```bash
# Manual backup
./scripts/backup/backup.sh daily

# Set up automatic backups
crontab -e
# Add contents from scripts/backup/crontab.txt
```

### Restore

```bash
# List backups
ls -lh /backup/*.sql.gz

# Restore from backup
./scripts/backup/restore.sh /backup/daily_20260614_020000.sql.gz
```

### Migrations

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend make migrate-up

# Rollback migrations
docker-compose -f docker-compose.prod.yml exec backend make migrate-down
```

## 📈 Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:8080/health

# Readiness probe
curl http://localhost:8080/ready

# Liveness probe
curl http://localhost:8080/live

# Metrics
curl http://localhost:8080/metrics
```

### Service Status

```bash
# Check all containers
docker-compose -f docker-compose.prod.yml ps

# Check resource usage
docker stats
```

## 🔐 Security

### Update SSL Certificate

```bash
# Renew Let's Encrypt certificate
docker-compose -f docker-compose.prod.yml exec certbot certbot renew

# Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Rotate Secrets

```bash
# 1. Update .env with new secrets
nano .env

# 2. Restart services
docker-compose -f docker-compose.prod.yml restart
```

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check environment variables
docker-compose -f docker-compose.prod.yml exec backend env

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U tzblog -d tzblog_prod -c "SELECT 1;"

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose -f docker-compose.prod.yml ps redis

# Test connection
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Check Redis logs
docker-compose -f docker-compose.prod.yml logs redis
```

## 📦 Updates

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./scripts/deploy.sh production
```

### Update Dependencies

```bash
# Update Go dependencies
cd backend
go get -u ./...
go mod tidy

# Rebuild
docker-compose -f docker-compose.prod.yml build backend
docker-compose -f docker-compose.prod.yml up -d backend
```

## 🔄 Rollback

### Rollback to Previous Version

```bash
# View commit history
git log --oneline

# Checkout previous version
git checkout <commit-hash>

# Deploy
./scripts/deploy.sh production
```

### Restore Database

```bash
# List backups
ls -lh /backup/*.sql.gz

# Restore
./scripts/backup/restore.sh /backup/daily_YYYYMMDD_HHMMSS.sql.gz
```

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/TZBlog/issues
- Email: support@tzblog.com
