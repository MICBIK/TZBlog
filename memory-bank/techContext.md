# TZBlog 技术上下文

**最后更新**: 2026-06-14

---

## 后端技术栈

### 核心框架
- **Go**: 1.21+
- **Gin**: Web 框架
- **GORM**: ORM
- **golang-migrate**: 数据库迁移工具

### 数据存储
- **PostgreSQL**: 15
  - 主数据库
  - 连接池配置：MaxOpen=25, MaxIdle=10, MaxLifetime=5m
- **Redis**: 7
  - 缓存（L2）
  - 会话存储
  - Token 黑名单

### 安全
- **JWT**: 认证方案
  - 密钥长度 ≥32 字符
  - 默认过期时间 7 天
- **bcrypt**: 密码哈希
  - Cost factor: 10
- **Token Blacklist**: Redis 实现
- **CSRF**: Double Submit Cookie 模式

### 性能优化
- **多层缓存**:
  - L1: 内存缓存（sync.Map + TTL）~10ns
  - L2: Redis ~1-3ms
- **查询优化**:
  - 17+ 个高级索引
  - N+1 查询已解决
  - 批量操作支持
- **连接池监控**: 实时健康检查

---

## 前端技术栈

### 核心框架
- **Next.js**: 15 (App Router)
- **React**: 19
- **TypeScript**: strict mode

### UI 组件
- **shadcn/ui**: 业务 UI 组件库
- **Radix UI**: 无障碍 UI 原语
- **Tailwind CSS**: v4

### 状态管理
- **Zustand**: 客户端状态
- **TanStack Query**: 服务器状态缓存

### 工具库
- **Axios**: HTTP 客户端
- **React Hook Form**: 表单处理
- **Zod**: Schema 验证

---

## 架构模式

### 后端架构（DDD + 分层）

```
Handler (API Layer)
    ↓
Service (Business Logic)
    ↓
Domain (Domain Models)
    ↓
Repository (Data Access)
    ↓
Database
```

### 关键设计模式
- **Repository Pattern**: 数据访问抽象
- **Service Layer**: 业务逻辑封装
- **Adapter Pattern**: postgres ↔ domain 桥接
- **Factory Pattern**: 依赖注入

---

## API 设计

### 路由前缀
- Base URL: `http://localhost:8080`
- API Prefix: `/api/v1`

### 响应格式
```json
{
  "success": true|false,
  "data": {...},
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  },
  "metadata": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 错误码
- 34 个标准错误码
- 11 大分类
- 5 种语言支持（en, zh, zh-TW, ja, ko）

### 认证
- Header: `Authorization: Bearer {jwt_token}`
- Token 有效期: 7 天
- 刷新机制: 前端自动刷新

---

## 数据库设计

### 核心表
- `users` - 用户表
- `articles` - 文章表
- `categories` - 分类表
- `tags` - 标签表
- `article_tags` - 文章标签关联（多对多）
- `comments` - 评论表（支持嵌套）
- `likes` - 点赞表
- `follows` - 关注表
- `views` - 阅读记录表
- `progress` - 阅读进度表

### 优化措施
- **外键约束**: 10+ 个，保证引用完整性
- **CHECK 约束**: 15+ 个，保证数据有效性
- **索引**: 17+ 个（单列 + 复合 + 覆盖 + 部分）
- **数据类型优化**: TEXT → VARCHAR(n)

---

## 测试策略

### 后端测试
- **单元测试**: 覆盖率 88.8%
  - 工具: Go testing + testify
  - Mock: gomock / testify/mock
- **集成测试**: Repository 层测试
- **基准测试**: 性能关键路径

### 前端测试（待实施）
- **单元测试**: Vitest + Testing Library
- **E2E 测试**: Playwright
- **覆盖率目标**: ≥80%

---

## 开发环境

### 后端
```yaml
server:
  port: 8080
  mode: development
database:
  host: localhost
  port: 5432
  user: tzblog
  password: tzblog
  dbname: tzblog_dev
redis:
  host: localhost
  port: 6379
```

### 前端
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_USE_MOCK=false
```

---

## 部署架构（规划）

### 生产环境
- **后端**: Docker + Kubernetes
- **前端**: Vercel
- **数据库**: Managed PostgreSQL
- **缓存**: Managed Redis
- **CDN**: Cloudflare
- **存储**: Cloudflare R2

### CI/CD
- **GitHub Actions**: 自动测试、构建、部署
- **分支保护**: PR review 必需
- **自动检查**: 测试、lint、类型检查

---

## 性能指标

### 后端性能
- **查询性能**: 5-10x 提升（vs 未优化）
- **缓存命中率**: 95-98%
- **API 响应时间**: <50ms (P95)
- **并发支持**: 1000+ req/s

### 数据库性能
- **存储优化**: -25%
- **查询速度**: 5-10x
- **索引效率**: 覆盖 90%+ 常用查询

---

## 安全措施

### 认证与授权
- JWT with algorithm verification
- Token revocation (blacklist)
- Session timeout (30 min)
- Concurrent session limit (3)

### 输入验证
- Schema-based validation (domain layer)
- XSS prevention (bluemonday)
- SQL injection prevention (parameterized queries)
- File upload validation (MIME type + extension)

### 速率限制
- Global: 100 req/sec per IP
- Login: 5 attempts/min per email+IP

### 审计
- All sensitive operations logged
- User, IP, timestamp, action, result
- Searchable audit log

---

## 已知限制

1. **图片上传**: 未实现，需要 Cloudflare R2 集成
2. **邮件服务**: 未配置 SMTP
3. **支付集成**: Stripe webhook 未完成
4. **全文搜索**: 基础 SQL LIKE，未用 Elasticsearch

---

**下次更新**: 前后端集成完成后
