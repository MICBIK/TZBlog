# TZBlog 后端开发 - Phase 1 完整实施

## Goal: 完成TZBlog后端Phase 1基础设施搭建

在feature/backend-init分支上，完成所有后端基础设施的搭建，包括Go项目脚手架、数据库迁移、配置管理、JWT认证、中间件、Docker和CI/CD配置。

---

## 项目背景

**项目**: TZBlog - 个人技术博客平台  
**GitHub**: https://github.com/MICBIK/TZBlog.git  
**当前分支**: main  
**工作目录**: /Users/baihaibin/Documents/WorkSpares/TZBlog  
**角色**: 后端开发负责人

**技术栈**:
- Go 1.22+
- Gin框架
- GORM
- PostgreSQL 15+
- Redis 7+
- JWT认证
- Docker

---

## 必读文档（已在项目中）

在开始前，这些文档已经在项目中准备好了：

1. docs/PROJECT_STANDARDS.md - Go代码规范、命名规范
2. docs/superpowers/specs/backend-architecture.md - 后端架构
3. docs/superpowers/specs/database-design.md - 完整数据库设计（10张表）
4. docs/superpowers/specs/api-design.md - API接口规范
5. docs/superpowers/specs/security-strategy.md - 安全策略
6. docs/TASK_BREAKDOWN.md - Phase 1详细任务
7. docs/FRONTEND_BACKEND_TASKS.md - 前后端分工

**请先读取这些文档，理解设计后再开始编码。**

---

## Phase 1 任务清单（按顺序执行）

### Task 1.1.1: Go项目脚手架初始化 (4小时)

**目标**: 创建完整的Go项目结构

**交付物**:
- backend/目录结构（cmd, internal, pkg, config, migrations等）
- go.mod文件
- Makefile
- README.md
- .env.example

**项目结构**:
```
backend/
├── cmd/server/main.go
├── internal/
│   ├── api/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   └── routes/
│   ├── domain/
│   ├── repository/
│   └── service/
├── pkg/
│   ├── logger/
│   ├── validator/
│   └── response/
├── config/
├── migrations/
├── scripts/
├── .env.example
├── .gitignore
├── Makefile
├── go.mod
└── README.md
```

**验收标准**:
- go mod init成功
- make run能启动（监听8080端口）
- make test能执行
- 目录结构符合PROJECT_STANDARDS.md

---

### Task 1.1.2: 数据库设计与迁移 (8小时)

**目标**: 创建10张核心表的数据库迁移

**数据库表**（参考 database-design.md）:
1. users - 用户表
2. categories - 分类表
3. tags - 标签表
4. articles - 文章表
5. article_tags - 文章标签关联表
6. comments - 评论表
7. likes - 点赞表
8. follows - 关注表
9. subscriptions - 订阅表
10. orders - 订单表

**交付物**:
- migrations/000001_init_schema.up.sql
- migrations/000001_init_schema.down.sql
- Makefile中的migrate-up/migrate-down命令

**验收标准**:
- make migrate-up成功创建所有表
- make migrate-down成功回滚
- 所有索引、触发器正确创建

---

### Task 1.1.3: 配置管理 (3小时)

**目标**: 使用Viper实现配置管理

**交付物**:
- config/config.go
- config/config.example.yaml
- .env.example

**配置项**:
- server配置（port, mode）
- database配置（host, port, user, password, dbname）
- redis配置（host, port, password, db）
- jwt配置（secret, expiry）
- storage配置（cloudflare r2）

**验收标准**:
- 能从config.yaml读取配置
- 能从环境变量覆盖配置
- 单元测试通过

---

### Task 1.1.4: JWT认证中间件 (6小时)

**目标**: 实现JWT Token生成、验证、中间件

**交付物**:
- pkg/auth/jwt.go
- internal/api/middleware/auth.go
- 单元测试

**功能**:
- GenerateToken(userID, role) string
- ValidateToken(token) (*Claims, error)
- Auth() gin.HandlerFunc

**验收标准**:
- 能生成有效Token
- 中间件能正确验证
- 测试覆盖率 > 80%

---

### Task 1.1.5: 基础中间件 (4小时)

**目标**: 实现CORS、Logger、Recovery、RequestID中间件

**交付物**:
- internal/api/middleware/cors.go
- internal/api/middleware/logger.go
- internal/api/middleware/recovery.go
- internal/api/middleware/request_id.go

**验收标准**:
- 所有中间件能正常工作
- 日志使用zap，结构化输出

---

### Task 1.1.6: 统一响应格式 (2小时)

**目标**: 实现统一的API响应格式

**交付物**:
- pkg/response/response.go

**响应格式**:
- Success(c, data)
- Error(c, code, msg)
- 格式：{success, data, error, metadata}

**验收标准**:
- Success(c, data)正常输出
- Error(c, code, msg)正常输出

---

### Task 1.3.1: Docker容器化 (4小时)

**目标**: 创建Dockerfile和docker-compose.yml

**交付物**:
- backend/Dockerfile
- docker-compose.yml（包含PostgreSQL、Redis、backend）

**验收标准**:
- docker-compose up -d成功启动
- 后端能连接PostgreSQL和Redis
- 所有服务running

---

### Task 1.3.2: GitHub Actions CI (3小时)

**目标**: 配置后端CI/CD

**交付物**:
- .github/workflows/backend-ci.yml

**CI流程**:
- Go lint
- Go test
- Go build

**验收标准**:
- PR自动触发CI
- 所有检查通过

---

## 开发规范（必须严格遵守）

### Git工作流

步骤1 - 创建分支:
```bash
git checkout -b feature/backend-init
```

步骤2 - 每个Task完成后提交:
```bash
git add .
git commit -m "feat(backend): complete Task 1.1.1 - Go project scaffold"
```

步骤3 - Phase 1全部完成后推送:
```bash
git push -u origin feature/backend-init
```

步骤4 - 创建PR到develop:
```bash
gh pr create --base develop --head feature/backend-init
```

### Commit规范

格式：
- feat(backend): 新功能
- fix(backend): Bug修复
- refactor(backend): 重构
- test(backend): 测试
- docs(backend): 文档

### 代码规范

- 包名：小写，无分隔符
- 接口：名词 + er后缀
- 结构体：PascalCase
- 方法：PascalCase，动词开头
- 使用GORM参数化查询（防SQL注入）
- 错误必须处理，使用fmt.Errorf包装

---

## Phase 1 完成标准

### 功能检查
- make run启动成功，监听8080端口
- make migrate-up成功创建所有表
- make test所有测试通过
- make lint无错误
- docker-compose up -d所有服务正常
- CI流程通过

### 代码质量
- 测试覆盖率 > 80%
- 无golint警告
- 符合PROJECT_STANDARDS.md规范

### 文档
- backend/README.md完整
- API文档更新（如有变化）

---

## 重要提醒

### 禁止操作
- 不要修改frontend/代码
- 不要修改docs/文档
- 不要提交.env文件
- 不要提交敏感信息

### 必须操作
- 严格按照Task 1.1.1 到 1.3.2顺序执行
- 每个Task完成后验收
- 使用Go 1.22+
- 所有配置通过环境变量
- 错误日志使用zap

---

## 进度追踪

完成一个Task后，在这里标记：
- [ ] Task 1.1.1: Go项目脚手架
- [ ] Task 1.1.2: 数据库迁移
- [ ] Task 1.1.3: 配置管理
- [ ] Task 1.1.4: JWT认证
- [ ] Task 1.1.5: 基础中间件
- [ ] Task 1.1.6: 统一响应
- [ ] Task 1.3.1: Docker
- [ ] Task 1.3.2: CI/CD

---

## 最终交付

Phase 1全部完成后，创建PR并在PR描述中列出：

1. 完成的所有任务
2. 验收标准检查结果
3. 技术栈说明
4. 使用说明

---

现在开始执行！从Task 1.1.1开始，一步步完成所有任务。Good luck!
