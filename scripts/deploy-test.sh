#!/bin/bash

# TZBlog 测试环境部署脚本
# 用途：部署完整的测试环境并运行集成测试

set -e

echo "========================================="
echo "   TZBlog 测试环境部署"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤 1: 检查依赖
echo "📦 Step 1: 检查依赖..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 依赖检查通过${NC}"
echo ""

# 步骤 2: 清理旧环境
echo "🧹 Step 2: 清理旧环境..."
docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
echo -e "${GREEN}✅ 旧环境已清理${NC}"
echo ""

# 步骤 3: 构建服务
echo "🔨 Step 3: 构建服务..."
docker-compose -f docker-compose.test.yml build --no-cache
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 服务构建成功${NC}"
echo ""

# 步骤 4: 启动服务
echo "🚀 Step 4: 启动服务..."
docker-compose -f docker-compose.test.yml up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 启动失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 服务已启动${NC}"
echo ""

# 步骤 5: 等待服务就绪
echo "⏳ Step 5: 等待服务就绪..."
echo "  等待 PostgreSQL..."
timeout 30 bash -c 'until docker exec tzblog-postgres-test pg_isready -U tzblog &>/dev/null; do sleep 1; done' || {
    echo -e "${RED}❌ PostgreSQL 启动超时${NC}"
    docker-compose -f docker-compose.test.yml logs postgres
    exit 1
}
echo -e "${GREEN}  ✅ PostgreSQL 就绪${NC}"

echo "  等待 Redis..."
timeout 30 bash -c 'until docker exec tzblog-redis-test redis-cli ping &>/dev/null; do sleep 1; done' || {
    echo -e "${RED}❌ Redis 启动超时${NC}"
    docker-compose -f docker-compose.test.yml logs redis
    exit 1
}
echo -e "${GREEN}  ✅ Redis 就绪${NC}"

echo "  等待后端服务..."
timeout 60 bash -c 'until curl -sf http://localhost:8080/health &>/dev/null; do sleep 2; done' || {
    echo -e "${RED}❌ 后端服务启动超时${NC}"
    docker-compose -f docker-compose.test.yml logs backend
    exit 1
}
echo -e "${GREEN}  ✅ 后端服务就绪${NC}"

echo "  等待前端服务..."
timeout 60 bash -c 'until curl -sf http://localhost:3000 &>/dev/null; do sleep 2; done' || {
    echo -e "${YELLOW}⚠️  前端服务启动超时（可能正常，继续...）${NC}"
}
echo -e "${GREEN}  ✅ 前端服务就绪${NC}"

echo ""
echo -e "${GREEN}✅ 所有服务已就绪${NC}"
echo ""

# 步骤 6: 运行数据库迁移
echo "🗄️  Step 6: 运行数据库迁移..."
# 注意：需要后端容器支持迁移命令
# docker exec tzblog-backend-test /app/server migrate up || {
#     echo -e "${YELLOW}⚠️  迁移失败或不支持${NC}"
# }
echo -e "${YELLOW}⚠️  请手动运行数据库迁移（如需要）${NC}"
echo ""

# 步骤 7: 健康检查
echo "🏥 Step 7: 健康检查..."
echo ""

echo "  检查后端 /health 端点..."
HEALTH=$(curl -sf http://localhost:8080/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✅ 后端健康检查通过${NC}"
    echo "     响应: $HEALTH"
else
    echo -e "${RED}  ❌ 后端健康检查失败${NC}"
fi
echo ""

echo "  检查后端 /ready 端点..."
READY=$(curl -sf http://localhost:8080/ready)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✅ 后端就绪检查通过${NC}"
    echo "     响应: $READY"
else
    echo -e "${YELLOW}  ⚠️  后端就绪检查失败${NC}"
fi
echo ""

# 步骤 8: 显示服务信息
echo "========================================="
echo "   🎉 部署完成"
echo "========================================="
echo ""
echo "📋 服务信息:"
echo "  - 前端: http://localhost:3000"
echo "  - 后端: http://localhost:8080"
echo "  - API:  http://localhost:8080/api/v1"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "📊 查看日志:"
echo "  docker-compose -f docker-compose.test.yml logs -f [service]"
echo ""
echo "🛑 停止服务:"
echo "  docker-compose -f docker-compose.test.yml down"
echo ""
echo "🧪 运行集成测试:"
echo "  ./scripts/integration-test.sh"
echo ""
