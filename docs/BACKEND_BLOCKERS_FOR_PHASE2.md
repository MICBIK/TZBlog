# 后端待补齐清单 — 阻塞前端 Phase 2 联调

> 本文档由前端负责人（ha1den）于 2026-06-14 编写，基于对 `backend/` 当前代码（feature/frontend-init 分支工作区）的逐文件调查。
> 后端负责人（Claude）请逐项核对，完成后在对应项打 `[x]` 并通知前端。
> 前端在等待期间会用 Mock 数据先行开发，后端就绪后通过环境变量 `NEXT_PUBLIC_USE_MOCK=false` 切换，**零代码改动**。

---

## 调查结论速览

| 维度 | 状态 |
|---|---|
| `go build ./...` | ✅ 通过（无编译错误） |
| `go vet ./...` | ⚠️ 有测试错误（`auth_test.go:18` AuthMiddleware 参数不匹配） |
| `go test ./...` | ❓ 未跑（依赖 PostgreSQL/Redis，本地缺环境） |
| handler 层 | ✅ 基本完整（auth/article/comment/like/follow/search/seo/sitemap/payment/subscription/health） |
| service 层 | ✅ auth/article/comment 完整 |
| repository 层 | ⚠️ 只有 article 有实现，其余 7 个 domain 只有 test 文件 |
| **入口/路由** | ❌ **完全没有 main.go / 路由注册**（最致命） |
| **数据库迁移** | ❌ **缺 000001_init_schema**（只有 000002_add_indexes） |
| **本地配置** | ❌ **没有 config.yaml**（只有 .env.prod.example） |

---

## 🔴 P0 致命缺失（不补齐，后端根本无法启动）

### B1. 创建 `main.go` 与路由注册
**现状**：整个项目没有 `func main()`，没有 `gin.Engine` 装配，所有 handler 是孤立代码。

**需要**：创建 `backend/cmd/server/main.go`（或 `backend/main.go`），完成：
1. 加载配置（`config.Load()`）
2. 初始化数据库连接（`config.NewPostgresDB()`）+ Redis
3. 实例化所有 repository → service → handler
4. 创建 Gin router，**注册所有路由**（见下方路由表）
5. 注册中间件（CORS / Logger / Recovery / RequestID / Auth）
6. 监听 `:8080`

**参考**：`docs/PROJECT_STANDARDS.md` 里规定了目录结构 `cmd/server/main.go`。

**前端需要的路由表**（method + path → handler 方法）：

```
# 认证
POST   /api/v1/auth/register          → AuthHandler.Register
POST   /api/v1/auth/login             → AuthHandler.Login
POST   /api/v1/auth/logout            → AuthHandler.Logout
GET    /api/v1/auth/me                → AuthHandler.GetCurrentUser      [需认证]
PUT    /api/v1/auth/profile           → AuthHandler.UpdateProfile       [需认证]
POST   /api/v1/auth/change-password   → AuthHandler.ChangePassword      [需认证]

# 文章
GET    /api/v1/articles               → ArticleHandler.ListArticles     (分页/筛选/排序)
GET    /api/v1/articles/:slug         → ArticleHandler.GetArticleBySlug
POST   /api/v1/articles               → ArticleHandler.CreateArticle    [需管理员]
PUT    /api/v1/articles/:id           → ArticleHandler.UpdateArticle    [需管理员]
DELETE /api/v1/articles/:id           → ArticleHandler.DeleteArticle    [需管理员]
POST   /api/v1/articles/:id/like      → (LikeHandler，需新建/挂载)

# 分类与标签
GET    /api/v1/categories             → (CategoryHandler，需新建)
GET    /api/v1/tags                   → (TagHandler，需新建)

# 评论
GET    /api/v1/articles/:id/comments  → CommentHandler.ListComments
POST   /api/v1/articles/:id/comments  → CommentHandler.CreateComment    [需认证]

# 图片上传
POST   /api/v1/upload/image           → (UploadHandler，需新建)         [需认证，multipart]

# 健康
GET    /health                        → HealthHandler.HealthCheck
GET    /ready                         → HealthHandler.Readiness
```

### B2. 创建初始数据库迁移 `000001_init_schema`
**现状**：`migrations/` 只有 `000002_add_indexes.up/down.sql`，**没有建表脚本**。无法建库。

**需要**：创建 `migrations/000001_init_schema.up.sql`，包含至少这些表（参考 `docs/superpowers/specs/database-design.md`）：
- `users`（id, username, email, password_hash, display_name, avatar_url, role, created_at...）
- `articles`（id, title, slug UNIQUE, summary, content, cover_image, author_id, category_id, status, view_count, like_count, is_premium, published_at...）
- `categories`（id, name, slug UNIQUE）
- `tags`（id, name, slug UNIQUE）
- `article_tags`（article_id, tag_id）多对多关联
- `comments`（id, article_id, user_id, parent_id, content...）
- `likes`（id, article_id, user_id, UNIQUE(article_id, user_id)）
- `follows`、`views`、`progress` 等按 database-design.md

配套 `000001_init_schema.down.sql` 做 DROP。

### B3. 提供本地开发配置 `config/config.yaml`
**现状**：只有 `.env.prod.example`，没有本地开发用的 `config/config.yaml`。`config.Load()` 读不到文件会报错。

**需要**：创建 `backend/config/config.yaml`（开发环境默认值），或在 `.env.example` 提供所有必需环境变量。至少包含：
```yaml
server:
  port: "8080"
  mode: development
database:
  host: localhost
  port: 5432
  user: tzblog
  password: tzblog
  dbname: tzblog
  sslmode: disable
redis:
  host: localhost
  port: 6379
jwt:
  secret: "<至少32位本地开发密钥>"   # ⚠️ 不能是弱密钥，config.go 有校验
  expiry: 168h
```

---

## 🟠 P1 高优先（阻塞前端核心功能）

### B4. 补齐 7 个缺失的 Repository 实现
**现状**：只有 `article_repo.go` 有实现，其余 7 个 domain 只有 `_test.go`：

| domain | 实现文件 | test 文件 | 状态 |
|---|---|---|---|
| article | ✅ article_repo.go | ✅ | 完整 |
| user | ❌ 缺 user_repo.go | ✅ user_repo_test.go | **缺实现** |
| category | ❌ 缺 category_repo.go | ✅ category_repo_test.go | **缺实现** |
| tag | ❌ 缺 tag_repo.go | ✅ tag_repo_test.go | **缺实现** |
| comment | ❌ 缺 comment_repo.go | ✅ comment_repo_test.go | **缺实现** |
| like | ❌ 缺 like_repo.go | ✅ like_repo_test.go | **缺实现** |
| view | ❌ 缺 view_repo.go | ✅ view_repo_test.go | **缺实现** |
| progress | ❌ 缺 progress_repo.go | ✅ progress_repo_test.go | **缺实现** |

**需要**：每个 domain 按 interface（定义在各 `internal/domain/*/` 里）用 GORM 实现对应的 `*_repo.go`。test 文件已存在，实现后跑通即可。

### B5. 新建 CategoryHandler 与 TagHandler
**现状**：完全没有 category/tag 的 handler 文件（只有 `_test.go`）。

**需要**：
- `GET /api/v1/categories`（列表）
- `POST /api/v1/categories`（创建，需管理员）
- `GET /api/v1/tags`（列表）
- `POST /api/v1/tags`（创建，需管理员）

### B6. 新建图片上传 UploadHandler + R2 集成
**现状**：没有 upload/image/storage handler。

**需要**：
- `POST /api/v1/upload/image`（multipart/form-data）
- 接收图片，校验格式（jpg/png/webp）与大小（≤5MB）
- 上传到 Cloudflare R2（S3 兼容）
- 返回 CDN URL：`{ success: true, data: { url: "https://..." } }`

---

## 🟡 P2 中优先（影响响应格式正确性）

### B7. 统一响应格式，补 `metadata` 字段
**现状**：存在**两套** response 包，格式冲突：
- `pkg/response/response.go`：`{ success, data, error: string }`（扁平）
- `internal/api/response/response.go`：`{ success, data, error: { code, message, details } }`（嵌套，较接近规范）

而 `docs/superpowers/specs/api-design.md` 要求的规范是：
```json
{
  "success": true,
  "data": {},
  "error": null,
  "metadata": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}
```

**问题**：
1. 两个包都没 `metadata` 字段 → **分页信息无处返回**，前端无法知道总页数
2. `pkg/response` 的 `error` 是字符串，与规范的嵌套对象不一致
3. `data` 用了 `omitempty` → 成功时 `data: null` 会被省略，前端要兼容

**需要**：
- 统一为一套 response 包（建议保留 `internal/api/response` 那套，废弃 `pkg/response`）
- 在 `Response` 结构里加 `Metadata *Metadata` 字段
- 列表接口（`GET /articles`）返回分页 metadata
- handler 全部改用统一包（目前 `auth_handler.go` 引用的是 `pkg/response`，不一致）

### B8. 修复 `go vet` 测试错误
**现状**：`internal/api/middleware/auth_test.go:18` 调用 `AuthMiddleware("...")` 但签名已改成 `AuthMiddleware(string, *cache.TokenBlacklist)`。

**需要**：更新 test 调用，补上第二个参数。

### B9. 确认 JSON 字段命名风格
**现状**：domain model 的 JSON tag 用了 **camelCase**（`createdAt`, `displayName`, `publishedAt`），但 `api-design.md` 示例用的是 camelCase，而前端 `types/article.ts` 里也定义的 camelCase —— **目前是一致的 ✅**。

⚠️ 但 `article_repo.go` 里有一个**独立的** `Article` struct（带 GORM tag 和自己的 JSON tag），与 `domain/article.Article` 是两个类型。请确认 service 层返回给 handler 的是哪个，字段名是否与前端 `types/article.ts` 完全对齐（特别是 `coverImage`、`isPremium`、`viewCount`、`likeCount`、`commentCount`）。

---

## ✅ 前端已就绪、等待后端的部分

前端 Phase 1 基础设施已全部完成并通过 5 轮审计，后端就绪后前端能立即联调：
- API 客户端（axios 拦截器/Token/错误处理）✅
- 类型定义（`types/article.ts`、`types/api.ts`）✅
- 认证 store（`authStore.ts`）✅
- 13 个路由占位页面 ✅
- QueryClient / shadcn 14 个组件 ✅

前端联调只需把 `NEXT_PUBLIC_USE_MOCK=false` + `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1`，后端启动后即可。

---

## 联调验收清单（后端补齐后，双方一起验证）

- [ ] `curl http://localhost:8080/health` 返回 200
- [ ] `POST /auth/register` 能注册新用户，返回 `{ user, token }`
- [ ] `POST /auth/login` 能登录，返回 token
- [ ] 带 token `GET /auth/me` 返回当前用户
- [ ] `GET /articles?page=1&limit=20` 返回列表 + metadata 分页
- [ ] `POST /articles`（管理员 token）能创建文章，返回 `{ id, slug, status }`
- [ ] `GET /articles/:slug` 返回详情含 content/tags/category/author
- [ ] `GET /categories` 和 `GET /tags` 返回列表
- [ ] `POST /upload/image` 能上传图片返回 CDN URL
- [ ] 401 错误返回规范 `{ success: false, error: { code, message } }`
