# TZBlog 详细任务分工与阶段规划

## 📋 目录
1. [Phase 1: 基础设施搭建](#phase-1-基础设施搭建)
2. [Phase 2: 核心功能开发](#phase-2-核心功能开发)
3. [Phase 3: 高级功能开发](#phase-3-高级功能开发)
4. [Phase 4: SEO优化与性能调优](#phase-4-seo优化与性能调优)
5. [Phase 5: 上线部署](#phase-5-上线部署)
6. [Phase 6: 运营与迭代](#phase-6-运营与迭代)

---

## Phase 1: 基础设施搭建
**时间**: Week 1-2  
**目标**: 搭建完整的开发环境，前后端能跑通基础功能

### 1.1 后端基础设施 (Day 1-4)

#### Task 1.1.1: 项目脚手架初始化
**负责人**: 后端开发  
**工时**: 4小时  
**交付物**:
- [ ] 创建Go项目，初始化go.mod
- [ ] 按照规范创建目录结构
- [ ] 配置Makefile（build, test, run, migrate等命令）
- [ ] 配置.gitignore
- [ ] 编写README.md

**验收标准**:
```bash
make run  # 能正常启动服务，监听8080端口
make test # 能运行测试（即使没有测试用例）
```

**依赖**: 无

---

#### Task 1.1.2: 数据库设计与迁移
**负责人**: 后端开发  
**工时**: 8小时  
**交付物**:
- [ ] 安装golang-migrate
- [ ] 根据database-design.md创建迁移文件
- [ ] 编写初始化脚本（创建10张核心表）
- [ ] 编写回滚脚本
- [ ] 测试迁移up/down

**验收标准**:
```bash
make migrate-up   # 成功创建所有表
make migrate-down # 成功回滚
psql -U postgres -d tzblog -c "\dt"  # 查看表结构正确
```

**依赖**: Task 1.1.1

**详细步骤**:
```bash
# 1. 安装migrate工具
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# 2. 创建迁移文件
migrate create -ext sql -dir migrations -seq init_schema

# 3. 编写迁移SQL
# migrations/000001_init_schema.up.sql (参考database-design.md)
# migrations/000001_init_schema.down.sql

# 4. Makefile添加命令
migrate-up:
	migrate -database "postgresql://$(DB_USER):$(DB_PASS)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=disable" -path migrations up

migrate-down:
	migrate -database "..." -path migrations down 1
```

---

#### Task 1.1.3: 配置管理
**负责人**: 后端开发  
**工时**: 3小时  
**交付物**:
- [ ] 使用Viper实现配置读取
- [ ] 创建config.yaml配置文件
- [ ] 支持环境变量覆盖
- [ ] 创建.env.example模板

**验收标准**:
```go
config := config.Load()
fmt.Println(config.Server.Port) // 输出8080
```

**配置结构**:
```yaml
server:
  port: 8080
  mode: debug # debug/release

database:
  host: localhost
  port: 5432
  user: postgres
  password: password
  dbname: tzblog

redis:
  host: localhost
  port: 6379
  password: ""
  db: 0

jwt:
  secret: your-secret-key
  expiry: 168h # 7天

storage:
  provider: cloudflare-r2
  bucket: tzblog
  access_key: xxx
  secret_key: xxx
```

**依赖**: Task 1.1.1

---

#### Task 1.1.4: JWT认证中间件
**负责人**: 后端开发  
**工时**: 6小时  
**交付物**:
- [ ] 实现JWT Token生成
- [ ] 实现JWT Token验证
- [ ] 编写Auth中间件
- [ ] 编写单元测试

**验收标准**:
```go
// 能生成有效Token
token := auth.GenerateToken(userID, role)

// 中间件能正确验证
router.Use(middleware.Auth())

// 测试覆盖率 > 80%
go test -cover ./internal/pkg/auth
```

**依赖**: Task 1.1.3

---

#### Task 1.1.5: 基础中间件
**负责人**: 后端开发  
**工时**: 4小时  
**交付物**:
- [ ] CORS中间件
- [ ] Logger中间件（使用zap）
- [ ] Recovery中间件（panic恢复）
- [ ] RequestID中间件

**验收标准**:
```go
router.Use(
    middleware.CORS(),
    middleware.Logger(),
    middleware.Recovery(),
    middleware.RequestID(),
)
// 请求能正常通过，日志正确输出
```

**依赖**: Task 1.1.3

---

#### Task 1.1.6: 统一响应格式
**负责人**: 后端开发  
**工时**: 2小时  
**交付物**:
- [ ] response包实现
- [ ] Success/Error函数
- [ ] 标准错误码定义

**验收标准**:
```go
response.Success(c, data)
// 输出: {"success": true, "data": {...}, "error": null}

response.Error(c, 404, "Not Found")
// 输出: {"success": false, "data": null, "error": {...}}
```

**依赖**: Task 1.1.1

---

### 1.2 前端基础设施 (Day 5-7)

#### Task 1.2.1: Next.js项目初始化
**负责人**: 前端开发  
**工时**: 3小时  
**交付物**:
- [ ] 使用create-next-app创建项目
- [ ] 配置TypeScript strict mode
- [ ] 配置Tailwind CSS v4
- [ ] 安装shadcn/ui
- [ ] 配置eslint + prettier

**验收标准**:
```bash
pnpm dev  # 能启动开发服务器
pnpm build # 能正常构建
pnpm lint # 无错误
```

**初始化命令**:
```bash
pnpm create next-app@latest tzblog-frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd tzblog-frontend
pnpm dlx shadcn@latest init
```

**依赖**: 无

---

#### Task 1.2.2: API客户端封装
**负责人**: 前端开发  
**工时**: 4小时  
**交付物**:
- [ ] 使用axios封装API client
- [ ] 请求/响应拦截器
- [ ] Token自动注入
- [ ] 错误统一处理

**验收标准**:
```typescript
// 能正常发起请求
const articles = await apiClient.get('/articles');

// Token自动注入
// 401自动跳转登录
```

**实现示例**:
```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // 跳转登录
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**依赖**: Task 1.2.1

---

#### Task 1.2.3: 基础组件库
**负责人**: 前端开发  
**工时**: 6小时  
**交付物**:
- [ ] 安装shadcn/ui核心组件
  - Button, Card, Input, Textarea
  - Dialog, DropdownMenu, Select
  - Toast, Alert
- [ ] 创建Loading组件
- [ ] 创建ErrorBoundary

**验收标准**:
```tsx
// 能正常使用shadcn组件
<Button variant="default">Click</Button>
<Card>Content</Card>

// 自定义组件能正常使用
<Loading />
<ErrorBoundary>{children}</ErrorBoundary>
```

**依赖**: Task 1.2.1

---

#### Task 1.2.4: 路由结构规划
**负责人**: 前端开发  
**工时**: 2小时  
**交付物**:
- [ ] 创建app目录结构
- [ ] 配置路由分组
- [ ] 创建布局文件

**目录结构**:
```
app/
├── (public)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── articles/
│   ├── about/
│   └── archive/
├── (auth)/
│   ├── layout.tsx
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── layout.tsx
│   └── admin/
├── layout.tsx
└── globals.css
```

**验收标准**:
```bash
# 能访问各个路由
http://localhost:3000/
http://localhost:3000/articles
http://localhost:3000/login
http://localhost:3000/admin
```

**依赖**: Task 1.2.1

---

### 1.3 DevOps基础 (Day 8-9)

#### Task 1.3.1: Docker容器化
**负责人**: DevOps/后端  
**工时**: 4小时  
**交付物**:
- [ ] 编写后端Dockerfile
- [ ] 编写前端Dockerfile
- [ ] 编写docker-compose.yml
- [ ] 一键启动脚本

**验收标准**:
```bash
docker-compose up -d
# 后端: http://localhost:8080
# 前端: http://localhost:3000
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

**docker-compose.yml示例**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: tzblog
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    environment:
      DB_HOST: postgres
      REDIS_HOST: redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8080/api/v1

volumes:
  postgres_data:
```

**依赖**: Task 1.1.1, Task 1.2.1

---

#### Task 1.3.2: GitHub Actions CI配置
**负责人**: DevOps/后端  
**工时**: 3小时  
**交付物**:
- [ ] 后端CI配置（测试、构建、lint）
- [ ] 前端CI配置（测试、构建、lint）
- [ ] 自动化测试

**验收标准**:
```yaml
# .github/workflows/backend.yml
# 每次push/PR自动运行
# - Go lint
# - Go test
# - Go build

# .github/workflows/frontend.yml
# - ESLint
# - TypeScript check
# - pnpm build
```

**依赖**: Task 1.1.1, Task 1.2.1

---

### 1.4 集成测试 (Day 10)

#### Task 1.4.1: 前后端联调测试
**负责人**: 全栈  
**工时**: 4小时  
**交付物**:
- [ ] 后端健康检查接口
- [ ] 前端能调用后端API
- [ ] CORS配置正确
- [ ] 环境变量配置正确

**验收标准**:
```bash
# 后端
curl http://localhost:8080/health
# {"status": "ok"}

# 前端能访问后端
fetch('http://localhost:8080/api/v1/health')
```

**依赖**: 所有前端、后端基础任务

---

## Phase 1 验收标准

### 后端
- [x] 项目结构完整
- [x] 数据库迁移成功
- [x] JWT认证中间件工作正常
- [x] 统一响应格式
- [x] 配置管理完善

### 前端
- [x] Next.js项目运行正常
- [x] Tailwind + shadcn/ui配置完成
- [x] API客户端封装完成
- [x] 路由结构清晰

### DevOps
- [x] Docker一键启动
- [x] CI/CD配置完成

### 交付检查
```bash
# 1. 后端启动成功
cd backend && make run
curl http://localhost:8080/health

# 2. 前端启动成功
cd frontend && pnpm dev
# 访问 http://localhost:3000

# 3. Docker启动成功
docker-compose up -d
docker-compose ps # 所有服务running

# 4. 测试通过
cd backend && make test
cd frontend && pnpm test

# 5. Lint通过
cd backend && make lint
cd frontend && pnpm lint
```

---

## Phase 2: 核心功能开发
**时间**: Week 3-6  
**目标**: 实现文章发布、浏览的完整流程

[继续下一部分...]
