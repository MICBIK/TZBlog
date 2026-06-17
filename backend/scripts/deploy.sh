#!/bin/bash

# Deployment script for TZBlog
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║           TZBlog Deployment Script                            ║"
echo "║           Environment: $ENVIRONMENT"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    echo "Please create .env from .env.prod.example"
    exit 1
fi

# Load environment variables
source .env

echo "Step 1: Pulling latest code..."
git pull origin main

echo "Step 2: Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "Step 3: Starting database & cache (so migrations run against a live DB)..."
docker-compose -f docker-compose.prod.yml up -d postgres redis

echo "Step 4: Running database migrations..."
# 生产镜像不含 migrate 工具：用 golang-migrate 官方镜像（compose 的 migrate 服务，profiles=tools）
# 对 migrations/ 下的 SQL 执行 up，经 compose 网络连接 postgres 服务。
docker-compose -f docker-compose.prod.yml run --rm migrate up

echo "Step 5: Starting application containers..."
docker-compose -f docker-compose.prod.yml up -d

echo "Step 6: Waiting for services to be healthy..."
sleep 10

# Health check
echo "Step 7: Performing health check..."
for i in {1..10}; do
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    else
        echo "⏳ Waiting for backend... ($i/10)"
        sleep 5
    fi

    if [ $i -eq 10 ]; then
        echo "❌ Health check failed!"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
done

echo "Step 8: Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║           ✅ Deployment completed successfully!                ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Services:"
echo "  • Backend: http://localhost:8080"
echo "  • Health: http://localhost:8080/health"
echo "  • Metrics: http://localhost:8080/metrics"
echo ""
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""
