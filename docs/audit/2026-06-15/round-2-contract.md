# 第 2 轮：前后端契约一致性 + 集成审计报告

**审计时间**: 2026-06-15
**审计范围**: 响应信封 / 字段命名 / 路由对齐 / 错误码 / 认证全链路 / CSRF 流转 / 分页 / 功能完整度
**审计性质**: 只读，独立复核当前 HEAD（`44c3199`）。这是旧审计最薄弱的维度。

---

## 📊 本轮摘要

| 维度 | 结论 |
|------|------|
| 响应信封 `{success,data,error,metadata}` | ✅ 一致 |
| 认证全链路（登录→存token→注入→401→登出） | 🟠 HIGH：刷新页面**丢失登录态**（未调 /auth/me 恢复） |
| 字段命名（camel/snake） | 🔴 BLOCKER：DTO 与 Model 风格混用，多个写接口字段对不上 |
| 文章 CRUD 路由对齐 | 🔴 BLOCKER：前端按 id，后端按 slug，写操作必然失败 |
| 文章列表/详情数据完整性 | 🔴 BLOCKER：列表返回全文 content；详情拿不到 author/tags |
| 点赞/上传路由 | 🟡 MEDIUM：点赞是已知未完成功能（D2） |
| CSRF token 流转 | ➡️ 见第 1 轮 SEC-1-01（完全断裂） |
| 前端功能完整度 | 🟠 HIGH：个人资料编辑/改密码/文章编辑等前端均未实现 |

**本轮发现问题**: 3 BLOCKER + 3 HIGH + 2 MEDIUM

---

## 🔴 BLOCKER

### CONTRACT-1-01：文章 CRUD 写操作前后端路由不匹配（必然失败）

**后端**（`backend/cmd/server/main.go:237-244`）：
```go
articlesProtected.PUT("/:slug", articleHandler.UpdateArticle)      // 按 slug
articlesProtected.PATCH("/:slug", articleHandler.PatchArticle)     // 按 slug
articlesProtected.DELETE("/:slug", articleHandler.DeleteArticle)   // 按 slug
```
handler 内部逻辑（`article_handler.go:196-222`）也是先 `c.Param("slug")` → `GetArticleBySlug` 拿到 ID → 再操作。

**前端**（`frontend/lib/api/article.ts:44-54`）：
```ts
export async function updateArticle(id: number, ...) {
  return apiPut(`/articles/${id}`);     // ← 传的是 id
}
export async function deleteArticle(id: number) {
  return apiDelete(`/articles/${id}`);  // ← 传的是 id
}
```

**结果**：前端发 `PUT /articles/123`，后端把 `"123"` 当 slug 查（`WHERE slug = '123'`），查不到 → 404，更新/删除永远失败。这是个**100% 复现的功能性 bug**。

**修复**：前端改为传 slug（需先持有文章 slug），或后端增加 `PUT /articles/by-id/:id` 路由（main.go 已有 `by-id` 分组用于 comments，可扩展）。建议统一为「公开读用 slug、管理写用 id」并在 API 文档明确。

---

### CONTRACT-1-02：DTO 与 Model 字段命名风格混用（snake_case vs camelCase）

**问题**：同一个领域内，`Model`（响应体）用 camelCase，`DTO`（请求体）用 snake_case，且 DTO 内部也不统一。

| 字段 | Model（响应） | CreateArticleDTO | UpdateArticleDTO | UpdateProfileDTO | ChangePasswordDTO |
|------|--------------|------------------|------------------|------------------|-------------------|
| 封面图 | `coverImage` ✅ | `coverImage` ✅ | `cover_image` ❌ | — | — |
| 显示名 | `displayName` ✅ | — | — | `display_name` ❌ | — |
| 头像 | `avatarUrl` ✅ | — | — | `avatar_url` ❌ | — |
| 当前密码 | — | — | — | — | `current_password` ❌ |
| 新密码 | — | — | — | — | `new_password` ❌ |

位置：
- `backend/internal/domain/article/service.go:51` `CoverImage *string json:"cover_image"`
- `backend/internal/domain/user/service.go:47-49` `display_name`/`bio`/`avatar_url`
- `backend/internal/domain/user/service.go:54-55` `current_password`/`new_password`

**影响**：`binding` 标签 + JSON tag 决定字段绑定。前端 `UpsertArticleRequest`/`AuthUser` 全用 camelCase。一旦前端实现"更新文章/编辑资料/改密码"功能：
- 前端发 `{ "coverImage": "x" }` → 后端 `UpdateArticleDTO` 找 `cover_image` → 绑定不到 → 字段不更新（静默失败，因为都是 `*string` 指针，nil 表示不更新）。
- 改密码同理：前端发 `{ "currentPassword": "x" }` → 后端绑定失败 → `binding:"required"` 触发 400。

**当前缓解**：前端目前**尚未实现**这些写功能的 UI（grep 确认无调用），所以暂时没爆发。但这是**定时炸弹**——一旦实现就踩坑。

**修复**：统一全链路为 camelCase（推荐，与前端 TS、与 Model 一致），或统一 snake_case。必须二选一，不能混用。重点改 DTO 的 JSON tag。

---

### CONTRACT-1-03：文章列表返回全文 content；详情拿不到 author/tags

**问题 A — 列表接口返回全文正文（性能反模式）**

`backend/internal/repository/postgres/article_repo.go:57-90` 的 `List` 直接 `query.Find(&articles)`，无 `Select`/`Omit` 排除 `content` 字段。`article.Article.Content` 是 `type:text`（全文）。

结果：`GET /articles`（默认 10 条）会把 10 篇文章的**完整 Markdown 正文**全部序列化进 JSON 返回。前端 `ArticleSummary` 也声明了 `content: string`，等于鼓励这种用法。

影响：
- 带宽浪费（10 篇长文可能几 MB）。
- 首屏 TTFB 慢。
- DB 传输量大。

**修复**：列表查询用 `Omit("content")` 或定义专门的 `ArticleListItem` 视图结构（只含 summary/counts）；前端 `ArticleSummary` 去掉 `content` 字段。

**问题 B — 详情接口拿不到 author 和 tags（数据缺失）**

`article.Article` 结构（`article.go:42-43`）：
```go
Author *user.User `json:"author,omitempty" gorm:"-"`   // gorm:"-" = GORM 完全忽略
Tags   []*tag.Tag `json:"tags,omitempty"   gorm:"-"`   // gorm:"-" = GORM 完全忽略
```

`FindByID`/`FindBySlug`/`List` 全部用 `r.db.First(&art, id)` / `Where(...).First()`，**没有任何 `Preload("Author")`/`Preload("Tags")`**。加上字段标了 `gorm:"-"`（即使 Preload 也不会填充）。

结果：`GET /articles/:slug` 详情接口返回的 `author` 和 `tags` **永远是 null**。前端详情页的作者信息卡片、标签列表将显示为空。

**修复**：
1. 把 `Author`/`Tags` 的 `gorm:"-"` 改为关联标签（如 `gorm:"foreignKey:AuthorID"` + `Preload`），或
2. 在 repository 层手动二次查询 author 和 tags 并组装（更可控）。
3. 前端 `ArticleSummary` 期望的 `author: Author`、详情的 tags 才能被填充。

---

## 🟠 HIGH

### CONTRACT-1-04：刷新页面丢失登录态（未调用 /auth/me 恢复）

**位置**: `frontend/lib/store/authStore.ts:49-56`、`frontend/components/providers/Providers.tsx`

`authStore` 的 `hydrateAuth()` 只做了一件事：
```ts
export function hydrateAuth(): void {
  if (typeof window === 'undefined') return;
  useAuthStore.setState({ hydrated: true });   // ← 只标记，不恢复 user
}
```

`Providers.tsx` 既没有调用 `hydrateAuth()`，也没有在挂载时调用 `getCurrentUser()`（`GET /auth/me`）来用 localStorage 里的 token 恢复 `user`。

**结果**：用户登录后 `setAuth(user, token)` 写入内存 + localStorage。但**刷新页面后**，内存清空 → `user = null` → `useAuth().isAuthenticated = false`：
- 普通页面：表现为"已登录但显示未登录状态"（顶部用户菜单消失）。
- `AdminGuard`：`isAuthenticated=false` → 显示 Loading → useEffect 跳转 `/login` → **管理员刷新后台就被踢回登录页**。

token 明明还在 localStorage 且未过期，axios 拦截器仍在发 Bearer token，但前端登录态已丢。

**修复**：在 `Providers`（或专门的 `AuthHydrator` 客户端组件）的 `useEffect` 中：
1. 读 localStorage token，若无则 `hydrated=true` 结束。
2. 若有 token，调 `getCurrentUser()`，成功则 `setAuth(user, token)`，失败（401）则清 token。
3. 最后 `hydrated=true`。

---

### CONTRACT-1-05：前端核心写功能缺失（API 层不完整）

grep 确认前端**完全没有调用**以下后端已实现的接口：

| 后端接口 | 前端调用 | 状态 |
|---------|---------|------|
| `PUT /auth/profile`（更新资料） | ❌ 无 | 未实现 |
| `PUT /auth/password`（改密码） | ❌ 无 | 未实现 |
| `PATCH /articles/:slug`（部分更新） | ❌ 无 | 未实现 |
| `GET /auth/me`（恢复登录态） | ❌ 无（仅在登录响应中拿 user） | 未接入刷新恢复 |

这意味着后台管理端的"个人设置页"（`app/(dashboard)/admin/settings/page.tsx` 存在）很可能是个**没有数据交互的空壳 UI**，或仅用 mock 数据。

**影响**：契约一致性无法在运行时验证（前端不调），但这些是产品核心功能（博主改资料/改密码/编辑文章）的缺口。

**修复**：补全前端 API 层 + 页面交互；补全时务必注意 CONTRACT-1-02 的字段命名对齐。

---

### CONTRACT-1-06：错误码前端只做字符串透传，无语义处理

**后端**（`pkg/errors`）定义了 65+ `AppError`，每个有 `Code`（如 `ARTICLE_NOT_FOUND`、`INVALID_CREDENTIALS`、`TOKEN_REVOKED`）和对应 HTTP 状态码（`response.HandleError` → `getStatusCode`）。

**前端**（`lib/api/client.ts:61-75` `normalizeError`）只把 `body.code` 当字符串塞进 `ApiRequestError.code`，业务层没有任何针对特定 code 的处理分支：
- `TOKEN_REVOKED`/`TOKEN_EXPIRED`：应触发重新登录（目前只对 HTTP 401 做了 `clearAuthAndRedirect`，但后端被吊销的 token 也是返回 401，OK）。
- `ARTICLE_NOT_FOUND`：详情页应显示 404 友好页（目前可能显示通用错误）。
- `RATE_LIMITED`（429）：应显示倒计时提示。

**影响**：用户体验差，错误提示不精准。非阻断，但属于契约利用不充分。

**修复**：前端建立一个 `errorCode → 用户友好提示/行为` 的映射表。

---

## 🟡 MEDIUM

### CONTRACT-1-07：点赞功能为半成品（前后端均标注未完成）

**前端**（`lib/api/like.ts` 注释）：*"后端 likes 表 schema 仍在修复中（D2），前端先用真实路径调用，失败时由调用方降级为本地乐观更新。"*

**后端** main.go 挂了 `/likes/articles/:id` 路由，但前端注释表明这是已知的未完成项（多态 likes 表设计）。这属于产品 WIP，需在路线图中跟踪。建议在 UI 上对未完成功能做降级/隐藏，避免用户操作后报错。

### CONTRACT-1-08：`GetArticleByID` handler 是死代码（无路由挂载）

`article_handler.go:72` 定义了 `GetArticleByID`（按 id 查），但 main.go 的文章路由只有 `GET /:slug`，没有 `GET /by-id/:id` 挂到 `GetArticleByID`（`by-id` 分组目前只挂了 comments）。该 handler 无法被访问，是死代码。

**修复**：若前端管理端需要按 id 查（编辑场景常用），补 `GET /articles/by-id/:id` 路由；否则删除该 handler。

---

## ✅ 契约方面一致的地方（客观记录）

| 项 | 说明 |
|----|------|
| 响应信封结构 | 后端 `response.Response{success,data,error,metadata}` 与前端 `types/api.ts ApiResponse<T>` 完全对齐 ✅ |
| 响应解包逻辑 | 前端 `client.ts` 拦截器正确处理 `success:false` 业务错误 + 解包 `{data,metadata}` ✅ |
| 401 处理 | 前端 401 清 token + 跳登录；后端 `AuthMiddleware` 失败返回 401 ✅ |
| 分页 metadata | `{total,page,limit,totalPages}` 前后端一致 ✅ |
| 认证 header | 前端 `Authorization: Bearer <token>` ↔ 后端 `AuthMiddleware` 解析 ✅ |
| Token 存储 | localStorage（`tzblog_token`），axios 拦截器自动注入 ✅（注意 XSS 风险，见 R1） |
| 路由前缀 | 前端 `API_BASE_URL = /api/v1` ↔ 后端 `v1 := router.Group("/api/v1")` ✅ |

---

## 本轮结论

契约层暴露的问题比安全层更"隐性"但同样致命：**文章写操作 100% 会失败**（id vs slug），**详情页拿不到作者和标签**（gorm:"-" + 无 Preload），**列表接口泄露全文**（性能），**刷新即掉登录**（未恢复 user）。这些都是"后端 API 存在、前端有对应类型，但两者对不齐"的典型集成裂缝。

根因分析：项目前后端是**并行开发**（分支策略隔离），但**缺少契约测试 / OpenAPI 单一事实源**。后端 Model 用 camelCase、DTO 用 snake_case 的混用，说明没有一个统一的序列化规范被遵守。建议引入 OpenAPI spec 作为前后端共同的契约源（后端已有 Swagger 注解，可生成 spec 供前端 codegen）。
