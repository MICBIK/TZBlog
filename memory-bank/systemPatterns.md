# TZBlog 系统模式

**最后更新**: 2026-06-14

---

## 架构模式

### 分层架构（DDD）

```
presentation/     Handler (Gin)
    ↓
application/      Service (Business Logic)
    ↓
domain/           Domain Models + Interfaces
    ↓
infrastructure/   Repository (GORM)
    ↓
database/         PostgreSQL
```

**规则**：
- Handler 只做请求/响应处理，不写业务逻辑
- Service 包含业务逻辑，调用 Domain 和 Repository
- Domain 是核心，定义实体和接口
- Repository 实现数据访问，不暴露 GORM 细节

---

## 设计模式

### 1. Repository Pattern

**目的**: 抽象数据访问，隔离业务逻辑和数据存储

**实现**:
```go
// Domain 定义接口
type ArticleRepository interface {
    Create(ctx context.Context, article *Article) error
    FindByID(ctx context.Context, id uint) (*Article, error)
    // ...
}

// Infrastructure 实现接口
type postgresArticleRepo struct {
    db *gorm.DB
}
```

**为什么**: 方便测试（mock），切换数据源不影响业务逻辑

---

### 2. Service Layer Pattern

**目的**: 封装业务逻辑，协调多个 Repository

**实现**:
```go
type ArticleService struct {
    articleRepo   ArticleRepository
    categoryRepo  CategoryRepository
    tagRepo       TagRepository
}

func (s *ArticleService) CreateArticle(ctx context.Context, req CreateArticleRequest) (*Article, error) {
    // 业务逻辑：验证、创建、关联
}
```

**为什么**: 业务逻辑集中管理，Handler 保持简单

---

### 3. Adapter Pattern

**目的**: 桥接不兼容的接口

**实现**: `article_adapter.go` 桥接 postgres repo 和 domain interface

**为什么**: Repository 实现使用了本地结构，需要适配到 domain 接口

---

### 4. Dependency Injection

**目的**: 解耦，提高可测试性

**实现**: `main.go` 中手动注入依赖
```go
articleRepo := postgres.NewArticleRepository(db)
articleService := service.NewArticleService(articleRepo)
articleHandler := handlers.NewArticleHandler(articleService)
```

**为什么**: 方便测试（注入 mock），清晰的依赖关系

---

## 错误处理模式

### 统一错误类型

```go
type AppError struct {
    Code    string
    Message string
    Details map[string]any
}
```

**规则**:
1. Domain 层抛出 AppError
2. Service 层传递或包装 AppError
3. Handler 层用 `response.HandleError()` 统一处理
4. 不在中间层吞掉错误

**为什么**: 
- 前端可以根据 code 做逻辑判断
- 统一的错误响应格式
- 支持国际化

---

## 缓存模式

### 多层缓存

```
Request → L1 (内存, ~10ns) → L2 (Redis, ~1-3ms) → DB (~10-50ms)
```

**规则**:
1. 热点数据用 L1（文章详情、热门列表）
2. 一般数据用 L2（分类、标签）
3. TTL: L1 < L2 < DB
4. 写操作清除相关缓存（级联）

**为什么**: 
- L1 极速但容量小
- L2 快速且容量大
- 分层减少数据库压力

---

## 数据库模式

### 外键约束 + CHECK 约束

**规则**:
1. 所有关联用外键（ON DELETE CASCADE / SET NULL）
2. 枚举字段用 CHECK 约束
3. 业务规则用 CHECK 约束（如：不能自己关注自己）

**为什么**: 
- 数据库层保证数据完整性
- 防止脏数据
- 自文档化

---

### 索引策略

**规则**:
1. 外键字段必须有索引
2. WHERE 常用字段加索引
3. 复合索引：过滤 + 排序
4. 覆盖索引：只查少量列
5. 部分索引：特定条件的子集

**为什么**: 
- 查询性能 5-10x 提升
- 减少索引体积
- 优化特定场景

---

## 安全模式

### 认证与授权

**认证流程**:
```
POST /login → 验证凭据 → 生成 JWT → 返回 token
后续请求 → Authorization header → 验证 token → 提取 user_id
```

**授权流程**:
```
需要管理员 → AuthMiddleware → CheckRole(admin) → 通过/拒绝
```

**规则**:
1. 敏感操作必须认证
2. 管理操作必须授权
3. Token 可撤销（黑名单）
4. 会话有超时

**为什么**: 
- 无状态认证（JWT）
- 可扩展（Redis 黑名单）
- 安全（超时、撤销）

---

### 输入验证三层防护

1. **Handler 层**: 基本格式验证（Gin binding）
2. **Domain 层**: 业务规则验证（长度、格式、逻辑）
3. **Database 层**: 约束强制（NOT NULL, CHECK, UNIQUE）

**为什么**: 
- 多层防护，安全性高
- 早期失败，快速反馈
- 数据库是最后防线

---

## 测试模式

### 单元测试

**规则**:
1. Repository: 用真实数据库（test container）
2. Service: mock Repository
3. Handler: mock Service
4. 覆盖率 ≥80%

**为什么**: 
- Repository 测试真实 SQL 逻辑
- Service/Handler 测试业务逻辑
- Mock 隔离依赖，测试快

---

### Table-Driven Tests

```go
tests := []struct {
    name    string
    input   Input
    want    Output
    wantErr bool
}{
    {"valid case", validInput, validOutput, false},
    {"invalid case", invalidInput, nil, true},
}
for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        // test logic
    })
}
```

**为什么**: 
- 容易添加测试用例
- 测试清晰可读
- 覆盖多种场景

---

## API 设计模式

### RESTful 原则

```
GET    /api/v1/articles        # 列表
GET    /api/v1/articles/:id    # 详情
POST   /api/v1/articles        # 创建
PUT    /api/v1/articles/:id    # 更新
DELETE /api/v1/articles/:id    # 删除
```

**规则**:
1. 名词复数做资源路径
2. HTTP method 表示操作
3. 嵌套资源最多两层
4. 查询参数做过滤/排序/分页

---

### 统一响应格式

```json
{
  "success": true|false,
  "data": {...},
  "error": {...},
  "metadata": {...}
}
```

**规则**:
1. 成功: success=true, data 有值
2. 失败: success=false, error 有值
3. 列表: metadata 有分页信息
4. 错误码标准化，支持 i18n

**为什么**: 
- 前端统一处理
- 清晰的成功/失败标识
- 完整的分页信息

---

## 性能模式

### 批量操作

**规则**:
1. 插入: 用 SQL 多行 INSERT
2. 更新: 用 CASE WHEN 批量更新
3. 查询: 用 IN 替代多次单查
4. 包在事务里保证原子性

**为什么**: 
- 批量操作 100x 性能提升
- 减少网络往返
- 减少事务开销

---

### 查询优化

**规则**:
1. 避免 N+1: 用 Preload
2. 只查需要的列: Select
3. 分页必加 LIMIT
4. 复杂查询用索引
5. 慢查询监控

**为什么**: 
- N+1 是最常见性能杀手
- 减少数据传输
- 索引加速查询

---

## 需要注意的反模式（避免）

### ❌ Handler 写业务逻辑
**错误**:
```go
func (h *Handler) Create(c *gin.Context) {
    // 大量业务逻辑在这里
}
```
**正确**: 业务逻辑放 Service

---

### ❌ 裸 SQL 字符串拼接
**错误**:
```go
db.Exec("DELETE FROM users WHERE id = " + id)
```
**正确**: 用参数化查询

---

### ❌ 忽略错误
**错误**:
```go
repo.Create(ctx, article) // 不检查错误
```
**正确**: 总是检查并处理错误

---

### ❌ 在循环里查询数据库
**错误**:
```go
for _, id := range ids {
    article, _ := repo.FindByID(ctx, id)
}
```
**正确**: 用 FindByIDs 批量查询

---

## 决策记录

### 为什么用 GORM 而不是 sqlx？
- **原因**: 团队熟悉，生产力高，迁移工具完善
- **代价**: 性能略低于原生 SQL
- **接受**: 可以用 Raw SQL 优化关键路径

### 为什么用 JWT 而不是 Session？
- **原因**: 无状态，易扩展，前后端分离友好
- **代价**: Token 大，无法主动失效（需黑名单）
- **接受**: 用 Redis 黑名单解决撤销问题

### 为什么用分层架构而不是六边形架构？
- **原因**: 项目规模中等，团队熟悉分层
- **代价**: 依赖方向清晰度不如六边形
- **接受**: 通过 interface 定义依赖反转

---

**下次更新**: 发现新模式或反模式时
