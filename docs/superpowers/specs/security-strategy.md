# 安全策略设计

## 认证与授权

### 1. JWT Token设计
```go
type Claims struct {
    UserID   int64  `json:"user_id"`
    Username string `json:"username"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}

// Token有效期: 7天
// Refresh Token: 30天
```

### 2. 权限控制
```go
// 角色权限
const (
    RoleAdmin  = "admin"   // 管理员：所有权限
    RoleAuthor = "author"  // 作者：发布文章
    RoleUser   = "user"    // 普通用户：评论、点赞
)

// 中间件
func RequireAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        // 验证token
    }
}

func RequireRole(role string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userRole := c.GetString("role")
        if userRole != role {
            c.JSON(403, gin.H{"error": "权限不足"})
            c.Abort()
        }
    }
}
```

## 安全防护措施

### 1. SQL注入防护
```go
// ✅ 使用GORM参数化查询
db.Where("slug = ?", slug).First(&article)

// ❌ 避免字符串拼接
db.Where("slug = '" + slug + "'").First(&article)
```

### 2. XSS防护
```go
import "html"

// 用户输入内容转义
func SanitizeInput(input string) string {
    return html.EscapeString(input)
}
```

### 3. CSRF防护
```go
// 使用gin-csrf中间件
import "github.com/utrack/gin-csrf"

router.Use(csrf.Middleware(csrf.Options{
    Secret: os.Getenv("CSRF_SECRET"),
    ErrorFunc: func(c *gin.Context) {
        c.JSON(403, gin.H{"error": "CSRF token invalid"})
        c.Abort()
    },
}))
```

### 4. 请求频率限制
```go
import "github.com/ulule/limiter/v3"

// 限制: 100次/分钟
rate := limiter.Rate{
    Period: 1 * time.Minute,
    Limit:  100,
}
```

### 5. 敏感信息保护
```go
// .env配置
DB_PASSWORD=xxx
JWT_SECRET=xxx
REDIS_PASSWORD=xxx

// 永远不提交到Git
// .gitignore
.env
.env.local
*.key
```

## 前端安全

### 1. 内容安全策略(CSP)
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

### 2. 避免XSS
```typescript
// 使用dangerouslySetInnerHTML前必须sanitize
import DOMPurify from 'isomorphic-dompurify';

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(content)
}} />
```

### 3. 敏感数据不存localStorage
```typescript
// ❌ 避免
localStorage.setItem('jwt_token', token)

// ✅ 使用httpOnly Cookie
// 后端设置
c.SetCookie("token", token, 3600*24*7, "/", "", true, true)
```
