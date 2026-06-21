# Phase 3 问题汇总与修复方案

**生成时间**: 2026-06-14  
**问题总数**: 60+  
**修复预估**: 4-6 周

---

## 🔴 BLOCKER 级别 (2个) - 必须立即修复

### B-001: Service 层在 Handler 中实例化
**优先级**: P0  
**工作量**: 2-3 天  
**影响**: 无法进行单元测试，违反 SOLID 原则

**当前问题**:
```go
// internal/api/handlers/article_handler.go
func NewArticleHandler(repo article.Repository) *ArticleHandler {
    return &ArticleHandler{
        service: service.NewArticleService(repo), // ❌ Handler 负责组装
    }
}
```

**修复方案**:
```go
// 1. Handler 依赖接口
type ArticleHandler struct {
    service ArticleService // 依赖抽象
}

func NewArticleHandler(service ArticleService) *ArticleHandler {
    return &ArticleHandler{service: service}
}

// 2. main.go 统一组装
articleService := service.NewArticleService(articleRepo)
articleHandler := handlers.NewArticleHandler(articleService)
```

---

### B-002: Service 层缺少接口定义
**优先级**: P0  
**工作量**: 1-2 天  
**影响**: 无法 mock，无法进行单元测试

**修复方案**:
```go
// internal/domain/article/service.go
package article

type Service interface {
    CreateArticle(userID int64, dto *CreateArticleDTO) (*Article, error)
    GetArticleByID(id int64) (*Article, error)
    UpdateArticle(id, userID int64, dto *UpdateArticleDTO) (*Article, error)
    DeleteArticle(id, userID int64) error
    ListArticles(filter *ListFilter) ([]*Article, int64, error)
}

// 在其他 domain 包也创建类似接口
```

---

## 🟠 CRITICAL 安全漏洞 (7个)

### SEC-004: 权限提升漏洞 🔴🔴🔴
**优先级**: P0 (最严重)  
**工作量**: 30 分钟  
**影响**: 任何用户可获得管理员权限

**当前问题**:
```go
// pkg/auth/jwt.go - 参数错误
func (j *JWTAuth) GenerateToken(userID int64, username string) (string, error) {
    return GenerateToken(userID, username, ...) // ❌ 应传 role
}
```

**修复方案**:
```go
// 1. 修复 jwt.go
func (j *JWTAuth) GenerateToken(userID int64, role string) (string, error) {
    return GenerateToken(userID, role, j.secret, j.expiry)
}

// 2. 修复调用处 internal/service/auth_service.go
token, err := s.jwtAuth.GenerateToken(newUser.ID, newUser.Role) // ✅
```

---

### SEC-001: 存储型 XSS 漏洞
**优先级**: P0  
**工作量**: 1 小时  
**影响**: 可窃取用户凭证

**修复方案**:
```go
// internal/service/article_service.go
func (s *ArticleService) CreateArticle(userID int64, dto *CreateArticleDTO) (*article.Article, error) {
    newArticle := &article.Article{...}
    newArticle.GenerateSlug()
    newArticle.CalculateReadingTime()
    
    // ✅ 添加：清理恶意内容
    newArticle.SanitizeContent()
    
    if err := newArticle.Validate(); err != nil {
        return nil, err
    }
    // ...
}

// 同样应用于:
// - UpdateArticle
// - CreateComment
// - UpdateComment
// - UpdateProfile
```

---

### SEC-002: CSRF 保护未启用
**优先级**: P1  
**工作量**: 45 分钟

**修复方案**:
```go
// cmd/server/main.go
v1 := router.Group("/api/v1")
v1.Use(middleware.OptionalCSRF()) // ✅ 启用 CSRF

// 登录时设置 token
auth.POST("/login", func(c *gin.Context) {
    if err := middleware.SetCSRFToken(c); err != nil {
        // handle error
    }
    authHandler.Login(c)
})
```

---

### SEC-003: 密码历史未检查
**优先级**: P1  
**工作量**: 1 小时

**修复方案**:
```go
// internal/service/auth_service.go
func (s *AuthService) ChangePassword(userID int64, dto *ChangePasswordDTO) error {
    // ✅ 检查密码历史
    recentPasswords, err := s.passwordHistoryRepo.GetRecentPasswords(userID, 5)
    if err != nil {
        return err
    }
    
    for _, hist := range recentPasswords {
        if bcrypt.CompareHashAndPassword([]byte(hist.Password), []byte(dto.NewPassword)) == nil {
            return errors.New("不能使用最近使用过的5个密码")
        }
    }
    
    // ... 更新密码
    
    // ✅ 保存到历史
    s.passwordHistoryRepo.Create(&PasswordHistory{
        UserID:   userID,
        Password: oldHash,
    })
    
    return nil
}
```

---

### SEC-005: 敏感信息泄露
**优先级**: P2  
**工作量**: 30 分钟

**修复方案**:
```go
// internal/api/handlers/payment_handler.go
// 替换错误详情为通用消息
logger.Error("Webhook validation failed", zap.Error(err))
c.String(400, "Invalid webhook signature") // ✅ 不泄露详情

// internal/api/handlers/health_handler.go
if err != nil {
    logger.Error("Health check failed", zap.String("check", "database"), zap.Error(err))
    checks["database"] = "unhealthy" // ✅ 不泄露错误
}
```

---

### SEC-006: 弱密码哈希
**优先级**: P2  
**工作量**: 15 分钟

**修复方案**:
```go
// internal/domain/user/user.go
const BcryptCost = 12 // ✅ 从 10 提高到 12

func (u *User) SetPassword(password string) error {
    hash, err := bcrypt.GenerateFromPassword([]byte(password), BcryptCost)
    if err != nil {
        return err
    }
    u.PasswordHash = string(hash)
    return nil
}
```

---

### SEC-007: 配置文件泄露风险
**优先级**: P3  
**工作量**: 20 分钟

**修复方案**:
```bash
# 1. 添加到 .gitignore
echo "config/config.yaml" >> .gitignore

# 2. 创建示例文件
cp config/config.yaml config/config.yaml.example

# 3. 删除已跟踪的文件
git rm --cached config/config.yaml
```

```go
// 3. 添加生产环境验证 config/config.go
if cfg.IsProduction() {
    if cfg.Database.Password == "tzblog" {
        return nil, fmt.Errorf("CRITICAL: Production must not use default password")
    }
}
```

---

## 🟠 CRITICAL 基础设施问题 (12个)

### C-001: API Key domain 层缺失
**优先级**: P0  
**工作量**: 4 小时  
**影响**: 无法编译

**修复方案**:
创建 `backend/internal/domain/apikey/apikey.go`:
```go
package apikey

import "time"

type APIKey struct {
    ID          int64
    UserID      int64
    Name        string
    KeyPrefix   string
    KeyHash     string
    Permissions []string
    IsRevoked   bool
    RevokedAt   *time.Time
    ExpiresAt   *time.Time
    LastUsedAt  *time.Time
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

type Repository interface {
    Create(*APIKey) error
    GetByID(int64) (*APIKey, error)
    GetByKeyHash(string) (*APIKey, error)
    GetByUserID(int64) ([]*APIKey, error)
    Revoke(int64, time.Time) error
    Delete(int64) error
    UpdateLastUsed(int64, time.Time) error
}
```

---

### C-002: 大表迁移锁表风险
**优先级**: P0  
**工作量**: 1-2 天  
**影响**: 生产环境长时间中断

**修复方案**:
```sql
-- migrations/000003_optimize_schema.up.sql

-- 1. 所有索引使用 CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_category
ON articles(category_id);

-- 2. 大表操作分阶段
-- Phase A: 添加新列
ALTER TABLE articles ADD COLUMN title_new VARCHAR(200);

-- Phase B: 批量迁移 (后台任务或分批执行)
UPDATE articles SET title_new = title WHERE id BETWEEN 1 AND 10000;
UPDATE articles SET title_new = title WHERE id BETWEEN 10001 AND 20000;
-- ...

-- Phase C: 切换列名 (快速操作)
ALTER TABLE articles DROP COLUMN title;
ALTER TABLE articles RENAME COLUMN title_new TO title;

-- 3. 添加超时保护
SET statement_timeout = '30s';
```

---

### C-003: 回滚脚本数据丢失风险
**优先级**: P0  
**工作量**: 半天

**修复方案**:
```sql
-- migrations/000003_optimize_schema.down.sql

-- 回滚前验证数据
DO $$
BEGIN
    -- 检查 title 长度
    IF EXISTS (SELECT 1 FROM articles WHERE LENGTH(title) > 200) THEN
        RAISE EXCEPTION 'Cannot rollback: found titles longer than 200 chars';
    END IF;
    
    -- 检查 slug 长度
    IF EXISTS (SELECT 1 FROM articles WHERE LENGTH(slug) > 250) THEN
        RAISE EXCEPTION 'Cannot rollback: found slugs longer than 250 chars';
    END IF;
END $$;

-- 然后执行回滚
ALTER TABLE articles ALTER COLUMN title TYPE TEXT;
ALTER TABLE articles ALTER COLUMN slug TYPE TEXT;
```

---

### C-004/C-005: Goroutine 泄漏
**优先级**: P0  
**工作量**: 1.5 小时  
**影响**: 内存持续增长导致 OOM

**修复方案**:
```go
// internal/api/middleware/login_ratelimit.go

var loginLimiterOnce sync.Once
var simpleLoginLimiterOnce sync.Once

func LoginRateLimit() gin.HandlerFunc {
    limiters := make(map[limiterKey]*rate.Limiter)
    var mu sync.RWMutex

    // ✅ 使用 sync.Once 确保只启动一次
    loginLimiterOnce.Do(func() {
        go func() {
            ticker := time.NewTicker(10 * time.Minute)
            defer ticker.Stop()
            for range ticker.C {
                mu.Lock()
                limiters = make(map[limiterKey]*rate.Limiter)
                mu.Unlock()
            }
        }()
    })
    
    return func(c *gin.Context) {
        // ... 现有逻辑
    }
}

// SimpleLoginRateLimit 同样修复
```

---

### C-006: 连接池监控未启动
**优先级**: P1  
**工作量**: 15 分钟

**修复方案**:
```go
// cmd/server/main.go

// 在数据库初始化后添加
poolMonitor := config.NewConnectionPoolMonitor(
    sqlDB,
    config.DefaultPoolAlertThresholds(),
)

monitorCtx, cancelMonitor := context.WithCancel(context.Background())
defer cancelMonitor()

go poolMonitor.Start(monitorCtx)
logger.Info("Connection pool monitor started")
```

---

### C-007-C-015: 数据库相关问题
**优先级**: P0-P1  
**工作量**: 3-4 小时

**问题清单**:
- C-007: 错误处理架构混乱
- C-008: main.go 依赖注入不完整
- C-009: Redis 密码无强度验证
- C-010: 数据库密码无强度要求
- C-011: Orders 表外键缺失
- C-012: Subscriptions 索引引用错误
- C-013: 缺少 api_keys 表
- C-014: 缺少 password_history 表
- C-015: 缺少 audit_logs 表

**统一修复方案**:
创建新的迁移文件 `000004_fix_critical_issues.up.sql`:

```sql
-- 1. 添加缺失的表
CREATE TABLE IF NOT EXISTS api_keys (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    permissions TEXT[],
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

CREATE TABLE IF NOT EXISTS password_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_history_user_id ON password_history(user_id);
CREATE INDEX idx_password_history_created_at ON password_history(created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_id BIGINT,
    resource_type TEXT,
    ip TEXT NOT NULL,
    user_agent TEXT,
    result TEXT NOT NULL,
    error_msg TEXT,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_ip ON audit_logs(ip);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_result ON audit_logs(result) WHERE result = 'failure';

-- 2. 修复外键
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. 删除错误的索引
DROP INDEX IF EXISTS idx_subscriptions_user_status;
DROP INDEX IF EXISTS idx_subscriptions_status_end;
```

---

## 📊 测试覆盖率问题

### 当前状态
- **整体覆盖率**: 22.0%
- **Handler 层**: 0%
- **Repository 层**: 0%
- **目标**: 80%

### 修复方案

#### 1. Handler 层测试 (预估 1 周)
```go
// internal/api/handlers/article_handler_test.go
package handlers_test

import (
    "testing"
    "net/http/httptest"
    "github.com/gin-gonic/gin"
)

func TestArticleHandler_Create(t *testing.T) {
    // Setup
    gin.SetMode(gin.TestMode)
    router := gin.New()
    
    mockService := &MockArticleService{}
    handler := handlers.NewArticleHandler(mockService)
    
    router.POST("/articles", handler.Create)
    
    // Test
    body := `{"title":"Test","content":"Content"}`
    req := httptest.NewRequest("POST", "/articles", strings.NewReader(body))
    w := httptest.NewRecorder()
    
    router.ServeHTTP(w, req)
    
    // Assert
    assert.Equal(t, 201, w.Code)
}
```

#### 2. Repository 层测试 (预估 1 周)
```go
// internal/repository/postgres/article_repo_test.go
package postgres_test

import (
    "testing"
    "github.com/stretchr/testify/assert"
)

func TestArticleRepo_Create(t *testing.T) {
    // 使用测试数据库
    db := setupTestDB(t)
    defer db.Close()
    
    repo := postgres.NewArticleRepository(db)
    
    article := &domain.Article{
        Title: "Test Article",
        Content: "Test Content",
    }
    
    err := repo.Create(article)
    assert.NoError(t, err)
    assert.NotZero(t, article.ID)
}
```

---

## 🎯 修复优先级路线图

### Week 1: 阻塞问题 (P0)
**Day 1**:
- [x] SEC-004 权限提升漏洞 (30分钟)
- [x] SEC-001 XSS 漏洞 (1小时)
- [x] C-004/C-005 Goroutine 泄漏 (2小时)
- [x] C-006 启动连接池监控 (15分钟)

**Day 2-3**:
- [x] C-001 创建 API Key domain 层 (4小时)
- [x] C-013/C-014/C-015 创建数据库表 (2小时)
- [x] C-011/C-012 修复数据库外键和索引 (1小时)

**Day 4-5**:
- [x] C-002 修复迁移脚本锁表问题 (1-2天)
- [x] C-003 添加回滚数据验证 (半天)

**Day 6-7**:
- [x] B-001 Service 层架构重构 - Part 1
- [x] B-002 创建 Service 接口

### Week 2: 严重问题 (P1)
**Day 1**:
- [x] SEC-002 启用 CSRF 保护 (45分钟)
- [x] SEC-003 集成密码历史检查 (1小时)
- [x] C-007 统一错误处理架构 (1天)

**Day 2**:
- [x] C-008 完善 main.go 依赖注入
- [x] C-009/C-010 配置密码强度验证

**Day 3-4**:
- [x] B-001 Service 层架构重构 - Part 2
- [x] C-016/C-017 API 文档修复

**Day 5**:
- [x] SEC-005/SEC-006/SEC-007 其他安全加固
- [x] C-019 迁移幂等性保护

### Week 3-4: 测试补充
**Week 3**:
- [x] Handler 层测试 (覆盖率 0% → 80%)
- [x] 重点: auth, article, comment handlers

**Week 4**:
- [x] Repository 层测试 (覆盖率 0% → 80%)
- [x] 集成测试

### Week 5-6: 持续优化
- [x] 提升现有模块覆盖率
- [x] 性能优化
- [x] 文档完善

---

## ✅ 验证清单

### 安全验证
- [ ] 创建 username="admin" 的普通用户，验证无管理员权限
- [ ] 文章内容注入 `<script>alert(1)</script>`，验证被清理
- [ ] 跨域 POST 请求无 CSRF token，验证被拦截
- [ ] 修改密码为历史密码，验证被拒绝
- [ ] Health check 返回错误时，确认无敏感信息

### 功能验证
- [ ] `go build ./...` 无错误
- [ ] `go test ./...` 全部通过
- [ ] 所有 migration 成功执行
- [ ] JWT 认证流程正常
- [ ] 文章 CRUD 功能正常
- [ ] API Key 管理功能可用

### 性能验证
- [ ] 连接池监控正常工作
- [ ] 无 Goroutine 泄漏
- [ ] 内存使用稳定
- [ ] 响应时间符合预期

---

## 📝 总结

### 修复工作量估算
- **P0 级别**: 5-7 天
- **P1 级别**: 3-4 天
- **测试补充**: 2-3 周
- **总计**: 4-6 周

### 当前风险等级
- **编译风险**: 🔴 高 (API Key 缺失)
- **安全风险**: 🔴 高 (权限提升 + XSS)
- **运行风险**: 🔴 高 (Goroutine 泄漏)
- **部署风险**: 🔴 高 (迁移脚本锁表)

### 修复后预期
- **编译风险**: ✅ 消除
- **安全风险**: 🟡 低
- **运行风险**: 🟢 低
- **部署风险**: 🟢 低
- **综合评分**: 85-90/100 (B+ to A-)

---

**生成时间**: 2026-06-14  
**维护者**: TZBlog Backend Team  
**状态**: ⚠️ 待修复
