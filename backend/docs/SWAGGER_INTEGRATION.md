# Swagger API 文档集成指南

## 已完成的工作

1. ✅ 安装了 swag CLI 工具
2. ✅ 添加了必要的 Go 依赖

## 集成步骤

### 1. 在 main.go 中添加 Swagger 通用注释

在项目的 `main.go` 文件开头添加以下注释：

```go
// @title           TZBlog API
// @version         1.0
// @description     TZBlog 后端 API 文档
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description JWT Token (格式: Bearer <token>)

// @externalDocs.description  OpenAPI
// @externalDocs.url          https://swagger.io/resources/open-api/
```

### 2. 在路由注册处添加 Swagger 路由

```go
import (
    httpSwagger "github.com/swaggo/http-swagger"
    _ "github.com/MICBIK/TZBlog/backend/docs" // 导入生成的 docs
)

// 在路由中添加
mux.HandleFunc("/swagger/", httpSwagger.WrapHandler)
```

### 3. 为 Handler 添加 Swagger 注释

#### 示例：文章列表接口

```go
// ListArticles godoc
// @Summary      获取文章列表
// @Description  分页获取文章列表，支持按状态、作者、分类等过滤
// @Tags         articles
// @Accept       json
// @Produce      json
// @Param        page     query    int     false  "页码 (默认: 1)"
// @Param        limit    query    int     false  "每页数量 (默认: 20)"
// @Param        status   query    string  false  "文章状态 (draft/published/archived)"
// @Param        author_id query   int    false  "作者ID"
// @Param        category_id query int    false  "分类ID"
// @Param        search   query    string  false  "搜索关键词"
// @Success      200  {object}  map[string]interface{}  "成功返回文章列表"
// @Failure      400  {object}  map[string]interface{}  "请求参数错误"
// @Failure      500  {object}  map[string]interface{}  "服务器内部错误"
// @Router       /articles [get]
func (h *ArticleHandler) List(w http.ResponseWriter, r *http.Request) {
    // ... 实现代码
}
```

#### 示例：创建文章接口（需要认证）

```go
// CreateArticle godoc
// @Summary      创建文章
// @Description  创建新文章（需要登录）
// @Tags         articles
// @Accept       json
// @Produce      json
// @Param        Authorization header string true "Bearer JWT Token"
// @Param        article body article.Article true "文章信息"
// @Security     BearerAuth
// @Success      201  {object}  map[string]interface{}  "成功创建文章"
// @Failure      400  {object}  map[string]interface{}  "请求参数错误"
// @Failure      401  {object}  map[string]interface{}  "未认证"
// @Failure      500  {object}  map[string]interface{}  "服务器内部错误"
// @Router       /articles [post]
func (h *ArticleHandler) Create(w http.ResponseWriter, r *http.Request) {
    // ... 实现代码
}
```

#### 示例：用户登录接口

```go
// Login godoc
// @Summary      用户登录
// @Description  使用用户名和密码登录，返回 JWT Token
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        credentials body object{username=string,password=string} true "登录凭证"
// @Success      200  {object}  map[string]interface{}{token=string,user=object}  "登录成功"
// @Failure      400  {object}  map[string]interface{}  "请求参数错误"
// @Failure      401  {object}  map[string]interface{}  "用户名或密码错误"
// @Failure      500  {object}  map[string]interface{}  "服务器内部错误"
// @Router       /auth/login [post]
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
    // ... 实现代码
}
```

### 4. 生成 Swagger 文档

在项目根目录执行：

```bash
cd backend
swag init
```

这会在 `backend/docs` 目录下生成以下文件：
- `docs.go` - 文档入口
- `swagger.json` - OpenAPI JSON 格式
- `swagger.yaml` - OpenAPI YAML 格式

### 5. 访问 Swagger UI

启动服务后，访问：
```
http://localhost:8080/swagger/index.html
```

## Swagger 注释标签说明

| 标签 | 说明 | 示例 |
|------|------|------|
| @Summary | 简短描述 | @Summary 获取文章列表 |
| @Description | 详细描述 | @Description 分页获取文章列表 |
| @Tags | API 分组标签 | @Tags articles |
| @Accept | 接受的内容类型 | @Accept json |
| @Produce | 返回的内容类型 | @Produce json |
| @Param | 参数定义 | @Param id path int true "文章ID" |
| @Success | 成功响应 | @Success 200 {object} Article |
| @Failure | 失败响应 | @Failure 404 {object} Error |
| @Security | 安全认证 | @Security BearerAuth |
| @Router | 路由和方法 | @Router /articles [get] |

## 参数位置说明

- `path` - 路径参数 (/articles/{id})
- `query` - 查询参数 (?page=1&limit=20)
- `header` - 请求头 (Authorization: Bearer xxx)
- `body` - 请求体 (JSON payload)
- `formData` - 表单数据

## 更新文档

每次修改 API 注释后，需要重新生成文档：

```bash
cd backend
swag init
```

## 注意事项

1. **必须在 main 包的 main.go 中添加通用注释**，否则无法生成文档
2. **参数类型必须准确**，支持 int、string、bool、object 等
3. **必需参数标记为 true**，可选参数标记为 false
4. **Security 标签对应 securityDefinitions**，必须在通用注释中先定义
5. **重新生成文档后需要重启服务**才能看到最新变化

## 后续工作

项目需要：
1. 找到或创建 `main.go` 文件
2. 添加 Swagger 通用注释
3. 为所有 Handler 方法添加 Swagger 注释
4. 执行 `swag init` 生成文档
5. 添加 Swagger UI 路由
6. 验证文档可访问
