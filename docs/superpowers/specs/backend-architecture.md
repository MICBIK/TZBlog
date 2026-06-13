# 后端架构设计

## 项目结构
```
backend/
├── cmd/
│   └── server/
│       └── main.go          # 应用入口
├── internal/
│   ├── api/                 # API路由和处理器
│   │   ├── handlers/
│   │   ├── middleware/
│   │   └── routes/
│   ├── domain/              # 业务领域模型
│   │   ├── article/
│   │   ├── user/
│   │   └── comment/
│   ├── repository/          # 数据访问层
│   ├── service/             # 业务逻辑层
│   └── pkg/                 # 内部工具包
│       ├── auth/
│       ├── cache/
│       └── email/
├── pkg/                     # 公共工具包
│   ├── logger/
│   ├── validator/
│   └── response/
├── config/
│   └── config.yaml
├── migrations/              # 数据库迁移
└── go.mod
```

## 核心依赖
```go
require (
    github.com/gin-gonic/gin v1.10.0
    gorm.io/gorm v1.25.0
    gorm.io/driver/postgres v1.5.0
    github.com/redis/go-redis/v9 v9.5.0
    github.com/golang-jwt/jwt/v5 v5.2.0
    github.com/spf13/viper v1.18.0
    go.uber.org/zap v1.27.0
)
```

## 分层架构

### 1. Handler层（API处理）
```go
type ArticleHandler struct {
    service service.ArticleService
}

func (h *ArticleHandler) GetArticle(c *gin.Context) {
    slug := c.Param("slug")
    article, err := h.service.GetBySlug(c, slug)
    if err != nil {
        response.Error(c, http.StatusNotFound, err)
        return
    }
    response.Success(c, article)
}
```
