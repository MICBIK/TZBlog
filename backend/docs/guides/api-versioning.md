# API 版本控制策略

## 概述

TZBlog API 采用 URL 路径版本控制策略，确保 API 的向后兼容性和平滑升级。

## 版本控制方案

### URL 路径版本控制

所有 API 端点都应包含版本前缀：

```
https://api.tzblog.com/api/v1/{resource}
```

### 版本格式

- **格式**: `v{major}`
- **示例**: `v1`, `v2`, `v3`
- **只使用主版本号**，不包含次版本号或补丁版本号

## 当前版本

| 版本 | 状态 | 发布日期 | 弃用日期 | 终止日期 |
|------|------|---------|---------|---------|
| v1 | ✅ Active | 2026-06-14 | - | - |

## API 路由结构

### v1 路由前缀

```
/api/v1/
├── auth/
│   ├── register
│   ├── login
│   ├── me
│   └── profile
├── articles/
│   ├── {id}
│   ├── slug/{slug}
│   └── ...
├── comments/
│   └── {id}
├── users/
│   └── {id}/
│       ├── follow
│       ├── unfollow
│       ├── followers
│       └── following
├── payment/
│   ├── checkout
│   ├── portal
│   ├── webhook
│   └── history
├── membership/
│   └── cancel
├── subscribe/
│   ├── verify
│   └── count
├── unsubscribe
├── search
├── health
├── ready
└── live
```

## 实现指南

### 1. 路由注册

```go
// internal/api/router.go
package api

import (
    "github.com/gin-gonic/gin"
    "github.com/MICBIK/TZBlog/backend/internal/api/handlers"
    "github.com/MICBIK/TZBlog/backend/internal/api/middleware"
)

func SetupRouter(
    router *gin.Engine,
    authHandler *handlers.AuthHandler,
    articleHandler *handlers.ArticleHandler,
    // ... 其他 handlers
) {
    // API v1 路由组
    v1 := router.Group("/api/v1")
    {
        // 健康检查端点（无版本前缀）
        router.GET("/health", healthHandler.HealthCheck)
        router.GET("/ready", healthHandler.Readiness)
        router.GET("/live", healthHandler.Liveness)
        
        // 认证相关
        auth := v1.Group("/auth")
        {
            auth.POST("/register", authHandler.Register)
            auth.POST("/login", authHandler.Login)
            auth.GET("/me", middleware.AuthRequired(), authHandler.GetCurrentUser)
            auth.PUT("/profile", middleware.AuthRequired(), authHandler.UpdateProfile)
        }
        
        // 文章相关
        articles := v1.Group("/articles")
        {
            articles.GET("", articleHandler.ListArticles)
            articles.GET("/:id", articleHandler.GetArticleByID)
            articles.GET("/slug/:slug", articleHandler.GetArticleBySlug)
            articles.POST("", middleware.AuthRequired(), articleHandler.CreateArticle)
            articles.PUT("/:id", middleware.AuthRequired(), articleHandler.UpdateArticle)
            articles.DELETE("/:id", middleware.AuthRequired(), articleHandler.DeleteArticle)
        }
        
        // 评论相关
        comments := v1.Group("/comments")
        {
            comments.GET("", commentHandler.ListComments)
            comments.GET("/:id", commentHandler.GetComment)
            comments.POST("", middleware.AuthRequired(), commentHandler.CreateComment)
            comments.PUT("/:id", middleware.AuthRequired(), commentHandler.UpdateComment)
            comments.DELETE("/:id", middleware.AuthRequired(), commentHandler.DeleteComment)
        }
        
        // 用户关注
        users := v1.Group("/users")
        {
            users.POST("/:id/follow", middleware.AuthRequired(), followHandler.Follow)
            users.POST("/:id/unfollow", middleware.AuthRequired(), followHandler.Unfollow)
            users.GET("/:id/is-following", middleware.AuthRequired(), followHandler.IsFollowing)
            users.GET("/:id/followers", followHandler.GetFollowers)
            users.GET("/:id/following", followHandler.GetFollowing)
        }
        
        // 支付相关
        payment := v1.Group("/payment")
        {
            payment.POST("/checkout", middleware.AuthRequired(), paymentHandler.CreateCheckoutSession)
            payment.POST("/portal", middleware.AuthRequired(), paymentHandler.CreatePortalSession)
            payment.POST("/webhook", paymentHandler.StripeWebhook)
            payment.GET("/history", middleware.AuthRequired(), paymentHandler.GetPaymentHistory)
        }
        
        // 会员相关
        membership := v1.Group("/membership")
        {
            membership.GET("", middleware.AuthRequired(), paymentHandler.GetMembership)
            membership.POST("/cancel", middleware.AuthRequired(), paymentHandler.CancelMembership)
        }
        
        // 订阅相关
        v1.POST("/subscribe", subscriptionHandler.Subscribe)
        v1.GET("/subscribe/verify", subscriptionHandler.Verify)
        v1.GET("/subscribe/count", subscriptionHandler.GetSubscriberCount)
        v1.GET("/unsubscribe", subscriptionHandler.Unsubscribe)
        
        // 搜索
        v1.GET("/search", searchHandler.Search)
        v1.GET("/search/stats", searchHandler.GetSearchStats)
    }
}
```

### 2. 更新 Swagger 注释

在 `main.go` 或主入口文件中更新 Swagger 配置：

```go
// @title           TZBlog API
// @version         1.0
// @description     TZBlog 博客系统 RESTful API
// @termsOfService  https://tzblog.com/terms

// @contact.name   API Support
// @contact.url    https://tzblog.com/support
// @contact.email  support@tzblog.com

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      api.tzblog.com
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description JWT Token，格式: "Bearer {token}"

// @externalDocs.description  API 文档
// @externalDocs.url          https://docs.tzblog.com
```

### 3. Handler 注释更新

所有 handler 的 `@Router` 注释应使用相对路径（不包含 `/api/v1`）：

```go
// CreateArticle creates a new article
// @Summary      创建文章
// @Description  创建新文章（需要登录）
// @Tags         Articles
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        article body service.CreateArticleDTO true "文章数据"
// @Success      201 {object} response.Response{data=article.Article}
// @Failure      400 {object} response.Response "请求参数错误"
// @Failure      401 {object} response.Response "未认证"
// @Failure      500 {object} response.Response "服务器错误"
// @Router       /articles [post]
```

## 向后兼容性规则

### ✅ 向后兼容的更改

以下更改可以在**不增加主版本号**的情况下进行：

1. **添加新的 API 端点**
   ```
   新增: GET /api/v1/articles/{id}/related
   ```

2. **添加新的可选请求参数**
   ```go
   // 添加可选的 sort 参数
   // @Param sort query string false "排序方式"
   ```

3. **添加新的响应字段**
   ```json
   {
     "id": 1,
     "title": "文章标题",
     "view_count": 100,  // 现有字段
     "share_count": 50   // ✅ 新增字段
   }
   ```

4. **扩展枚举值**（仅添加新值）
   ```go
   // 之前: draft, published
   // 现在: draft, published, scheduled  // ✅ 添加新状态
   ```

5. **放宽验证规则**
   ```go
   // 之前: 密码至少 12 字符
   // 现在: 密码至少 8 字符  // ✅ 更宽松
   ```

### ❌ 破坏性更改（需要新版本）

以下更改**必须增加主版本号**：

1. **删除或重命名端点**
   ```
   ❌ 删除: DELETE /api/v1/articles/{id}
   ❌ 重命名: /articles -> /posts
   ```

2. **删除或重命名请求/响应字段**
   ```json
   {
     "user_id": 1      // ❌ 删除
     "userId": 1       // ❌ 重命名
   }
   ```

3. **更改字段类型**
   ```json
   {
     "count": "100"    // ❌ string -> number
     "count": 100
   }
   ```

4. **添加必需的请求参数**
   ```go
   // ❌ 将可选参数改为必需
   // @Param user_id query int true "用户ID"  // 之前是 false
   ```

5. **收紧验证规则**
   ```go
   // ❌ 密码从 8 字符改为 12 字符
   ```

6. **更改错误响应格式**
   ```json
   // ❌ 更改错误结构
   ```

7. **修改认证机制**
   ```
   ❌ 从 JWT 改为 OAuth2
   ```

## 版本弃用流程

### 1. 弃用公告（Deprecation Notice）

在响应头中添加弃用警告：

```go
// middleware/version.go
func DeprecationWarning(version string) gin.HandlerFunc {
    return func(c *gin.Context) {
        if strings.HasPrefix(c.Request.URL.Path, "/api/"+version) {
            c.Header("Deprecation", "true")
            c.Header("Sunset", "2027-12-31T23:59:59Z")  // RFC 8594
            c.Header("Link", `<https://docs.tzblog.com/migration>; rel="sunset"`)
        }
        c.Next()
    }
}
```

### 2. 弃用时间线

| 阶段 | 时间 | 说明 |
|------|------|------|
| **公告** | T+0 | 发布弃用公告，添加响应头警告 |
| **文档更新** | T+1周 | 更新文档，标记为 Deprecated |
| **邮件通知** | T+1月 | 向 API 用户发送邮件通知 |
| **终止前警告** | T+5月 | 最后警告，建议立即迁移 |
| **正式终止** | T+6月 | 停止旧版本 API 服务 |

### 3. 弃用标记

在 Swagger 注释中标记已弃用的端点：

```go
// @Summary      获取文章 (已弃用)
// @Description  此端点已弃用，请使用 v2 版本
// @Tags         Articles
// @Deprecated   true
// @Router       /articles/{id} [get]
```

## 版本迁移指南

### 从无版本迁移到 v1

如果现有 API 没有版本控制，迁移步骤：

1. **保持现有端点正常工作**
   ```go
   // 同时支持旧路由和新路由
   router.GET("/articles", articleHandler.ListArticles)      // 旧
   router.GET("/api/v1/articles", articleHandler.ListArticles)  // 新
   ```

2. **添加弃用警告**
   ```go
   // 对旧端点添加弃用警告
   router.Use(DeprecationWarning("legacy"))
   ```

3. **文档更新**
   - 更新所有文档指向新版本端点
   - 提供迁移指南

4. **逐步淘汰**
   - 6个月后停止支持旧端点

## 客户端适配

### 1. 设置基础 URL

```typescript
// 客户端配置
const API_BASE_URL = 'https://api.tzblog.com/api/v1';

class APIClient {
  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }
  
  async get(endpoint: string) {
    return fetch(`${this.baseURL}${endpoint}`);
  }
}

// 使用
const client = new APIClient();
const articles = await client.get('/articles');
```

### 2. 版本切换

```typescript
// 支持多版本
const clientV1 = new APIClient('https://api.tzblog.com/api/v1');
const clientV2 = new APIClient('https://api.tzblog.com/api/v2');

// 逐步迁移
const articles = await clientV2.get('/articles').catch(() => {
  // 回退到 v1
  return clientV1.get('/articles');
});
```

### 3. 检测弃用警告

```typescript
async function fetchWithDeprecationCheck(url: string) {
  const response = await fetch(url);
  
  if (response.headers.get('Deprecation') === 'true') {
    const sunset = response.headers.get('Sunset');
    console.warn(`API endpoint is deprecated. Sunset date: ${sunset}`);
    
    // 发送遥测数据
    trackDeprecationUsage(url, sunset);
  }
  
  return response;
}
```

## 监控与分析

### 1. 版本使用统计

```go
// middleware/metrics.go
func VersionMetrics() gin.HandlerFunc {
    return func(c *gin.Context) {
        version := extractVersion(c.Request.URL.Path)
        
        // 记录版本使用情况
        apiVersionRequests.WithLabelValues(version).Inc()
        
        c.Next()
    }
}
```

### 2. 弃用端点监控

```go
func DeprecatedEndpointMetrics() gin.HandlerFunc {
    return func(c *gin.Context) {
        if isDeprecated(c.Request.URL.Path) {
            deprecatedAPIRequests.WithLabelValues(
                c.Request.URL.Path,
                c.ClientIP(),
            ).Inc()
        }
        c.Next()
    }
}
```

## 最佳实践

### 1. 命名规范

- ✅ 使用 `/api/v1` 而不是 `/api/1.0`
- ✅ 使用 `/api/v1` 而不是 `/v1/api`
- ✅ 端点名称使用复数形式: `/articles` 而不是 `/article`

### 2. 文档管理

- 每个版本维护独立的 Swagger 文档
- 提供版本迁移指南
- 清晰标记已弃用的功能

### 3. 测试策略

- 为每个版本维护独立的测试套件
- 测试版本间的向后兼容性
- 测试弃用警告的正确性

### 4. 发布流程

```
1. 代码审查 → 2. 更新文档 → 3. 发布 Beta → 4. 收集反馈 → 5. 正式发布
```

## 常见问题 (FAQ)

### Q: 为什么使用 URL 路径版本控制而不是请求头？

A: URL 路径版本控制的优势：
- 更直观，易于测试和调试
- 可以在浏览器中直接访问
- CDN 缓存友好
- 不需要额外的请求头配置

### Q: 何时应该发布新的主版本？

A: 当需要进行破坏性更改时，如：
- 重大架构调整
- 安全性改进（如更改认证方式）
- 不兼容的数据格式更改

### Q: 如何处理微小的 bug 修复？

A: Bug 修复不需要新版本：
- 直接在当前版本修复
- 确保修复不会破坏现有功能
- 在发布说明中记录

### Q: 多久需要废弃一个旧版本？

A: 建议时间线：
- 至少支持 6 个月
- 提前 3 个月发布弃用公告
- 企业客户可能需要更长的支持期

## 参考资源

- [Semantic Versioning 2.0.0](https://semver.org/)
- [REST API Versioning](https://restfulapi.net/versioning/)
- [Microsoft REST API Guidelines - Versioning](https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md#12-versioning)
- [Stripe API Versioning](https://stripe.com/docs/api/versioning)

---

**最后更新**: 2026-06-14  
**维护者**: TZBlog Backend Team
