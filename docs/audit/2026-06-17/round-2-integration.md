# Round 2 — 前后端集成

**评分**: 82/100（昨天 85） · **基线**: `main @ 9853c2a`

## 历史问题核实
| ID | 问题 | 状态 | 证据 |
|----|------|------|------|
| R2-2 | 响应信封 {success,data,metadata} 解包 | ✅ FIXED | `lib/api/client.ts:103-124` 拦截器解包；success===false 抛 `ApiRequestError` 读 `payload.error.{message,code,details}`，与后端 `response.go:12-32` 字段一致 |
| R2-3 | 文章详情未 Preload Author/Tags | ✅ FIXED | `article_repo.go:33` FindByID、`:47-50` FindBySlug 均 `Preload("Author").Preload("Tags")` |
| R2-4 | 刷新丢登录态 | ✅ FIXED | `authStore.ts:53-72` hydrateAuth 读 localStorage 调 /auth/me；`Providers.tsx:34-36` 挂载即调 |
| R2-5 | by-id/:id vs :slug 路由不对齐 | ✅ FIXED | 前端 `article.ts:33/48/53` 与后端 `main.go:244/257-258` 完全对齐（handler 里 @Router 注释为过时 swagger） |
| R2-1 | 登录字段 email/username | ⚠️ PARTIAL | 类型层一致（`types/auth.ts:23-26` ↔ `service.go:35-38`），但登录 UI 根本没接 API（见 HIGH-1） |

## 新发现
- **HIGH-1** 登录/注册 UI 未接后端 — `AuthTerminal.tsx:50-91` handleSubmit 只客户端校验后弹「✓ 登录成功」，从不调 `login()`/`register()`/`setAuth()`，不写 token、不跳转；OAuth/魔法链接只 showToast。**前台无法真正登录**。（主流程已验证）
- **HIGH-2** tag_id 过滤端到端失效 — `article_handler.go:148-150` 解析 `filter.TagID`，`article_repo.go:62-103` List 从不使用（无 article_tags JOIN）→ 按标签筛选恒返回全量。（主流程已验证）
- **HIGH-3** /articles 忽略 category/tag(slug)/sort — `articles/page.tsx:27` 传的 `category`/`tag`/`sort` 仅 `/search` 支持，`ListArticles(article_handler.go:135-152)` 不读 → 分类/标签筛选静默失效。
- **MEDIUM** 点赞字段漂移 — 前端 `like.ts:4-7` 期望 `likeCount`，后端 `like_handler.go:156-158` 返回 `count`，且 like/unlike `:74-76,115-117` 不回计数 → 计数恒 undefined。
- **LOW** 注册 displayName 被静默丢弃 — `types/auth.ts:33` 有该字段，后端 `RegisterDTO(service.go:28-32)` 无，ShouldBindJSON 忽略。

## 小结
昨天 5 个集成问题 4 个确认已修，类型契约对齐度高。真正欠账是 **UI 与 API 的实际接线**（登录假成功）+ 三处后端过滤/字段契约漂移（tag_id、category/tag/sort、likeCount）。分数略降因这些是真实端到端缺口。
