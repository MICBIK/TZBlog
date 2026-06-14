# TZBlog 后端修复方案与路线图

**生成日期**: 2026-06-14  
**基于**: 全量审计报告（118+ 问题）  
**目标**: 从 48 分提升到 80+ 分，达到生产就绪标准

---

## 🎯 修复策略

基于审计发现的 118+ 个问题，我们制定了**分阶段、渐进式**的修复策略：

1. **Phase 0**: 紧急修复（P0）- 阻塞上线的安全问题
2. **Phase 1**: 核心修复（P1）- 架构和测试
3. **Phase 2**: 质量提升（P2）- 性能和优化
4. **Phase 3**: 完善优化（P3）- 长期改进

---

## 📅 Phase 0: 紧急修复（1-2天）

**目标**: 修复所有 CRITICAL 安全漏洞，达到最低上线标准  
**工作量**: 6-8 小时  
**优先级**: P0 - 立即执行

### 必须修复的问题（10个）

#### 1. SEC-001: JWT 算法验证 ⚠️⚠️⚠️

**工作量**: 15 分钟  
**文件**: `pkg/auth/jwt.go:39`

```go
// 修复前
token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
    return []byte(secret), nil  // ❌ 未验证算法
})

// 修复后
token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
    // ✅ 验证签名算法
    if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
        return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
    }
    return []byte(secret), nil
})
```

#### 2. SEC-002: Token 撤销机制

**工作量**: 1 小时  
**方案**: Redis 黑名单

```go
// internal/cache/token_blacklist.go
type TokenBlacklist struct {
    redis *redis.Client
}

func (b *TokenBlacklist) Revoke(tokenID string, expiry time.Duration) error {
    return b.redis.Set(context.Background(), "revoked:"+tokenID, "1", expiry).Err()
}

func (b *TokenBlacklist) IsRevoked(tokenID string) bool {
    return b.redis.Exists(context.Background(), "revoked:"+tokenID).Val() > 0
}

// middleware/auth.go 中检查
if tokenBlacklist.IsRevoked(claims.JTI) {
    response.Unauthorized(c, "Token has been revoked")
    c.Abort()
    return
}
```

#### 3. SEC-003: JWT Secret 强度验证

**工作量**: 15 分钟  
**文件**: `cmd/server/main.go`

```go
// 启动时验证
if cfg.JWT.Secret == "" || cfg.JWT.Secret == "your-secret-key-change-in-production" {
    logger.Fatal("CRITICAL: JWT_SECRET must be set to a strong secret in production")
}
if len(cfg.JWT.Secret) < 32 {
    logger.Fatal("CRITICAL: JWT_SECRET must be at least 32 characters")
}
```

#### 4. B3: CORS 配置修复

**工作量**: 30 分钟  
**文件**: `internal/api/middleware/cors.go`

```go
func CORS(allowedOrigins []string) gin.HandlerFunc {
    return func(c *gin.Context) {
        origin := c.GetHeader("Origin")
        
        // 白名单验证
        allowed := false
        for _, allowedOrigin := range allowedOrigins {
            if origin == allowedOrigin {
                allowed = true
                break
            }
        }
        
        if allowed {
            c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
            c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
        }
        
        // ...
    }
}

// config/config.yaml
server:
  cors:
    allowed_origins:
      - http://localhost:3000
      - https://yourdomain.com
```

#### 5. SEC-004: 登录限流

**工作量**: 45 分钟

```go
// middleware/login_ratelimit.go
func LoginRateLimit() gin.HandlerFunc {
    limiter := make(map[string]*rate.Limiter)
    var mu sync.RWMutex
    
    return func(c *gin.Context) {
        email := c.PostForm("email")
        ip := c.ClientIP()
        key := email + ":" + ip
        
        mu.Lock()
        if _, exists := limiter[key]; !exists {
            limiter[key] = rate.NewLimiter(rate.Every(time.Minute), 5) // 每分钟5次
        }
        l := limiter[key]
        mu.Unlock()
        
        if !l.Allow() {
            response.TooManyRequests(c, "Too many login attempts, try again later")
            c.Abort()
            return
        }
        
        c.Next()
    }
}
```

#### 6. SEC-006: CSRF 防护

**工作量**: 1 小时  
**方案**: Double Submit Cookie

```go
// middleware/csrf.go
func CSRF() gin.HandlerFunc {
    return func(c *gin.Context) {
        if c.Request.Method == "GET" || c.Request.Method == "HEAD" || c.Request.Method == "OPTIONS" {
            c.Next()
            return
        }
        
        cookieToken, err := c.Cookie("csrf_token")
        if err != nil {
            response.Forbidden(c, "CSRF token missing")
            c.Abort()
            return
        }
        
        headerToken := c.GetHeader("X-CSRF-Token")
        if headerToken == "" || headerToken != cookieToken {
            response.Forbidden(c, "CSRF token invalid")
            c.Abort()
            return
        }
        
        c.Next()
    }
}
```

#### 7. CONC-001: Goroutine 泄漏修复

**工作量**: 30 分钟  
**文件**: `middleware/ratelimit.go`

```go
var cleanupOnce sync.Once

func IPRateLimiter(rps int, burst int) gin.HandlerFunc {
    rl := &ipRateLimiter{...}
    
    cleanupOnce.Do(func() {
        go rl.startCleanup()
    })
    
    return func(c *gin.Context) {...}
}
```

#### 8. DB-001: 时间戳类型统一

**工作量**: 1.5 小时

```go
// 统一改为 time.Time
type Article struct {
    ID          int64      `json:"id" gorm:"primaryKey"`
    CreatedAt   time.Time  `json:"created_at"`  // 改为 time.Time
    UpdatedAt   time.Time  `json:"updated_at"`
    DeletedAt   *time.Time `json:"deleted_at,omitempty" gorm:"index"`
    PublishedAt *time.Time `json:"published_at,omitempty"`
}

// 删除操作改为
Update("deleted_at", time.Now())  // 而不是 EXTRACT(EPOCH ...)
```

#### 9. C13.1: DSN 密码脱敏

**工作量**: 15 分钟

```go
func (c *DatabaseConfig) GetDSN() string {
    return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
        c.Host, c.Port, c.User, "***REDACTED***", c.DBName, c.SSLMode)
}

func (c *DatabaseConfig) GetDSNForConnection() string {
    return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
        c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode)
}
```

#### 10. 添加所有操作的超时 context

**工作量**: 45 分钟

```go
// Redis/R2/Meilisearch 所有操作添加超时
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

if err := client.Ping(ctx).Err(); err != nil {
    return nil, err
}
```

### Phase 0 完成标准

- ✅ 所有 CRITICAL 安全漏洞已修复
- ✅ JWT 无法被绕过
- ✅ CORS/CSRF 防护到位
- ✅ 登录限流生效
- ✅ Goroutine 不再泄漏
- ✅ 时间戳类型统一

**预期结果**: 安全评分从 35 → 65，可以安全上线

---

## 📅 Phase 1: 核心修复（1周）

**目标**: 完善架构，提升测试覆盖率  
**工作量**: 3-4 天  
**优先级**: P1 - 上线后立即执行

### 1. 引入 Service 层（B1）

**工作量**: 1 天

```go
// internal/service/article_service.go
type ArticleService struct {
    repo article.ArticleRepository
}

func (s *ArticleService) CreateArticle(userID int64, req *CreateArticleDTO) (*article.Article, error) {
    // 业务逻辑封装
    slug := generateSlug(req.Title)
    readingTime := calculateReadingTime(req.Content)
    
    newArticle := &article.Article{
        AuthorID:    userID,
        Title:       req.Title,
        Slug:        slug,
        Content:     req.Content,
        ReadingTime: readingTime,
        Status:      req.Status,
    }
    
    // 验证
    if err := newArticle.Validate(); err != nil {
        return nil, err
    }
    
    return s.repo.Create(newArticle)
}

// Handler 简化为
func (h *ArticleHandler) CreateArticle(c *gin.Context) {
    var req CreateArticleRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, "Invalid request")
        return
    }
    
    userID := c.GetInt64("user_id")
    article, err := h.service.CreateArticle(userID, &req)
    if err != nil {
        response.HandleError(c, err)
        return
    }
    
    response.Created(c, article)
}
```

### 2. 统一错误处理体系（B2）

**工作量**: 0.5 天

```go
// pkg/errors/errors.go
type AppError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
    Cause   error  `json:"-"`
}

var (
    ErrArticleNotFound = &AppError{Code: "ARTICLE_NOT_FOUND", Message: "Article not found"}
    ErrUnauthorized    = &AppError{Code: "UNAUTHORIZED", Message: "Authentication required"}
    ErrForbidden       = &AppError{Code: "FORBIDDEN", Message: "Permission denied"}
)

// response/response.go
func HandleError(c *gin.Context, err error) {
    var appErr *AppError
    if errors.As(err, &appErr) {
        c.JSON(getStatusCode(appErr.Code), gin.H{
            "success": false,
            "error": gin.H{
                "code":    appErr.Code,
                "message": appErr.Message,
                "details": appErr.Details,
            },
        })
        return
    }
    
    // 未知错误
    InternalError(c, "Internal server error")
}
```

### 3. 提升测试覆盖率至 40%

**工作量**: 2 天

**优先测试模块**:
- Service 层单元测试
- 支付系统测试
- 认证授权测试
- 缓存逻辑测试

```go
// internal/service/article_service_test.go
func TestArticleService_CreateArticle(t *testing.T) {
    mockRepo := new(MockArticleRepository)
    service := NewArticleService(mockRepo)
    
    req := &CreateArticleDTO{
        Title:   "Test Article",
        Content: "Test content",
        Status:  "draft",
    }
    
    mockRepo.On("Create", mock.Anything).Return(&article.Article{ID: 1}, nil)
    
    result, err := service.CreateArticle(1, req)
    
    assert.NoError(t, err)
    assert.NotNil(t, result)
    mockRepo.AssertExpectations(t)
}
```

### 4. 性能优化

**N+1 查询修复** (0.5天):
```go
// 合并为一次查询
db.Preload("Author", func(db *gorm.DB) *gorm.DB {
    return db.Select("id, username, avatar")
}).Preload("Tags", func(db *gorm.DB) *gorm.DB {
    return db.Select("id, name, slug")
}).Find(&articles)
```

**添加缺失索引** (0.5天):
```sql
CREATE INDEX idx_articles_status_created ON articles(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_article_created ON comments(article_id, created_at DESC) WHERE deleted_at IS NULL;
```

### Phase 1 完成标准

- ✅ Service 层引入完成
- ✅ 错误处理统一
- ✅ 测试覆盖率 ≥ 40%
- ✅ N+1 查询已修复
- ✅ 关键索引已添加

**预期结果**: 综合评分从 48 → 68

---

## 📅 Phase 2: 质量提升（2周）

**目标**: 修复所有 HIGH 级别问题  
**工作量**: 1周  
**优先级**: P2 - 第一次迭代后

### 重点修复

1. XSS 防护（使用 bluemonday）
2. 文件上传 MIME 验证
3. Domain 模型添加 Validate 方法
4. 补全 Swagger 文档
5. 添加更多复合索引
6. 缓存穿透/雪崩防护
7. 测试覆盖率提升至 60%

---

## 📅 Phase 3: 完善优化（1个月）

**目标**: 达到生产级别标准  
**优先级**: P3 - 长期优化

### 目标

1. 测试覆盖率提升至 80%+
2. 所有 MEDIUM 问题修复
3. 引入 DI 容器（wire）
4. API 文档 100% 覆盖
5. 性能测试和压测
6. 监控和告警完善

---

## 🎯 修复优先级总结

### 立即执行（今天）

1. SEC-001: JWT 算法验证
2. SEC-002: Token 撤销
3. SEC-003: Secret 验证
4. B3: CORS 修复
5. SEC-004: 登录限流
6. SEC-006: CSRF 防护
7. CONC-001: Goroutine 泄漏
8. DB-001: 时间戳统一
9. C13.1: DSN 脱敏
10. 添加超时 context

**工作量**: 6-8 小时

### 本周执行

11. B1: 引入 Service 层
12. B2: 统一错误处理
13. 提升测试覆盖率至 40%
14. N+1 查询优化
15. 添加缺失索引

**工作量**: 3-4 天

### 下次迭代

16-30: 所有 HIGH 级别问题
31-70: 所有 MEDIUM 级别问题

---

## 📊 预期效果

| 阶段 | 工作量 | 综合评分 | 安全评分 | 测试覆盖 | 生产就绪度 |
|------|--------|---------|---------|---------|-----------|
| **当前** | - | 48/100 | 35/100 | 2.5% | 45% ❌ |
| **Phase 0** | 8h | 58/100 | 65/100 | 2.5% | 60% ⚠️ |
| **Phase 1** | 4d | 68/100 | 70/100 | 40% | 75% ✅ |
| **Phase 2** | 1w | 78/100 | 80/100 | 60% | 85% ✅ |
| **Phase 3** | 1m | 85+/100 | 90/100 | 80%+ | 95% ✅ |

---

## 💡 实施建议

### 如果时间紧迫

**最小可行方案**: 只执行 Phase 0（8小时）

- 修复所有 CRITICAL 安全漏洞
- 可以安全上线
- 后续持续优化

### 如果追求质量

**推荐方案**: Phase 0 + Phase 1（5天）

- 安全问题全部修复
- 架构更加健壮
- 有基础测试覆盖
- 性能得到优化

### 如果追求完美

**完整方案**: Phase 0 + Phase 1 + Phase 2 + Phase 3（1.5个月）

- 生产级别代码
- 所有问题修复
- 高测试覆盖
- 性能优秀

---

## 🔧 工具和资源

### 需要的库

```bash
go get github.com/microcosm-cc/bluemonday  # XSS 防护
go get golang.org/x/time/rate              # 限流（已有）
go get github.com/google/uuid              # UUID 生成
```

### 测试工具

```bash
go test -race ./...           # 竞态检测
go test -cover ./...          # 覆盖率
go test -bench=. ./...        # 性能测试
```

---

## 📋 下一步行动

**建议**: 从 Phase 0 开始，8小时修复关键安全问题

1. 现在就开始修复
2. 或者先规划前端
3. 或者先看其他方案

**需要我立即开始修复吗？** 😊
