# 第 7 轮（第二轮审计）：契约一致性复审报告

**审计时间**: 2026-06-15（第二轮）
**审计基线 HEAD**: `42aa129`
**对照**: 第一轮报告 round-2-contract.md 的 8 个问题
**审计目的**: 验证契约修复是否真生效 + 发现新问题

---

## 📊 本轮摘要

| 第一轮问题 | 修复状态 | 验证结论 |
|-----------|---------|---------|
| CONTRACT-1-01 文章写操作 id vs slug | ✅ **已修复** | 新增 `PUT/DELETE /by-id/:id` 路由 |
| CONTRACT-1-02 DTO 字段命名混乱 | ✅ **已修复** | 全部 DTO 统一 camelCase |
| CONTRACT-1-03A 列表返回全文 content | ✅ **已修复** | `Omit("content")` |
| CONTRACT-1-03B 详情拿不到 author/tags | 🔴 **未修复** | 仍无 Preload，`gorm:"-"` 未改，service 无组装 |
| CONTRACT-1-04 刷新丢失登录态 | 🔴 **未修复** | Providers 仍不调 /auth/me |
| CONTRACT-1-05 前端写功能缺失 | ✅ **已修复** | 新增 settings/写功能 UI（见 R9） |
| CONTRACT-1-06 错误码无语义处理 | ❓ 未验证（低优） | — |
| CONTRACT-1-07 点赞半成品 | ❓ 未验证 | — |
| CONTRACT-1-08 GetArticleByID 死代码 | ✅ 已挂载 by-id 路由 | — |

**本轮结论**: 契约层修复**质量很高**（8 个问题修了 5 个，且都是真修），但**最关键的两个数据完整性问题未修**（详情 author/tags + 刷新登录）。

---

## 🔴 未修复的关键问题

### CONTRACT-7-01：详情接口仍拿不到 author 和 tags（CONTRACT-1-03B 未修）

**完整证据链**：

1. **Model 字段仍是 `gorm:"-"`**（`article.go:42-43`）：
```go
Author *user.User `json:"author,omitempty" gorm:"-"`   // GORM 完全忽略
Tags   []*tag.Tag `json:"tags,omitempty"   gorm:"-"`   // GORM 完全忽略
```

2. **Repo 的 `FindBySlug`/`FindByID` 仍无 Preload**（`article_repo.go:64-66`）：
```go
func (r *ArticleRepository) FindBySlug(slug string) (*article.Article, error) {
    var art article.Article
    err := r.db.Where("slug = ?", slug).First(&art).Error  // 无 Preload
```

3. **Service 的 `GetArticleBySlug` 无手动组装**（`article_service.go:140-155`）：
```go
func (s *ArticleService) GetArticleBySlug(slug string) (*article.Article, error) {
    art, err := s.repo.FindBySlug(slug)   // 直接返回，未填充 Author/Tags
    ...
    return art, nil   // art.Author=nil, art.Tags=nil
}
```

4. **ArticleService 未注入 userRepo**（`article_service.go:14-18`）：只有 `tagRepo`，即使想手动查 author 也无能为力。

**后果**：`GET /api/v1/articles/:slug` 详情接口返回的 JSON 中 `author: null`、`tags: null`。前端详情页的**作者信息卡片、标签列表永久显示为空**。这是用户最直观感知的"页面残缺"。

**修复**（二选一）：

**方式 A — 改 gorm tag + Preload（推荐，GORM 原生）**：
```go
// article.go
Author   *user.User `json:"author,omitempty" gorm:"foreignKey:AuthorID"`
Tags     []*tag.Tag `json:"tags,omitempty" gorm:"many2many:article_tags;"`

// article_repo.go FindBySlug
err := r.db.Where("slug = ?", slug).Preload("Author").Preload("Tags").First(&art).Error
```

**方式 B — service 层手动组装（更可控，但需注入 userRepo）**：
```go
// article_service.go
func NewArticleService(repo article.Repository, tagRepo tag.TagRepository, userRepo user.UserRepository) ...
func (s *ArticleService) GetArticleBySlug(slug string) (*article.Article, error) {
    art, err := s.repo.FindBySlug(slug)
    ...
    // 手动填充
    if u, _ := s.userRepo.FindByID(art.AuthorID); u != nil { art.Author = u }
    if tags, _ := s.tagRepo.FindByArticleID(art.ID); tags != nil { art.Tags = tags }
    return art, nil
}
```

---

### CONTRACT-7-02：刷新页面仍丢失登录态（CONTRACT-1-04 未修）

**完整证据链**：

1. **`Providers.tsx` 只配置 QueryClient，不恢复登录态**：
```tsx
export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({...}));
  return <QueryClientProvider client={queryClient}>{children}...</QueryClientProvider>;
  // ← 无 useEffect 调 /auth/me，无 hydrateAuth()
}
```

2. **`authStore.ts:53` 的 `hydrateAuth()` 仍是空标记**：
```ts
export function hydrateAuth(): void {
  if (typeof window === 'undefined') return;
  useAuthStore.setState({ hydrated: true });  // 只标记，不恢复 user
}
```

3. **grep 确认无 `getCurrentUser`/`getMe`/`/auth/me` 调用**：整个前端没有任何地方在应用启动时用 localStorage 的 token 去后端换取 user 信息。

**后果**：
- 用户登录 → `setAuth(user, token)` 写内存+localStorage。
- **刷新页面** → 内存清空 → `user=null` → `isAuthenticated=false`。
- `AdminGuard` 检测到未认证 → 跳 `/login` → **管理员刷新后台就被踢回登录页**。
- token 明明还在 localStorage 且未过期，但前端"忘了"自己登录过。

**修复**：在 Providers（或专门的 `AuthHydrator` 客户端组件）中：
```tsx
'use client';
function AuthHydrator() {
  useEffect(() => {
    const token = localStorage.getItem('tzblog_token');
    if (!token) { useAuthStore.setState({ hydrated: true }); return; }
    getCurrentUser()  // GET /auth/me，axios 自动带 token
      .then(user => setAuth(user, token))
      .catch(() => clearAuth())  // 401 则清 token
      .finally(() => useAuthStore.setState({ hydrated: true }));
  }, []);
  return null;
}
// 在 Providers 中渲染 <AuthHydrator />
```

---

## ✅ 真正修复确认（客观记录，质量很高）

### CONTRACT-1-01 文章写操作 id/slug —— ✅ 优秀
```go
// main.go:254-255 新增 by-id 路由
articlesProtected.PUT("/by-id/:id", articleHandler.UpdateArticleByID)
articlesProtected.DELETE("/by-id/:id", articleHandler.DeleteArticleByID)
```
前端可按 id 更新/删除，保留了 slug 路由兼容。**还新增了批量操作**：
```go
articlesProtected.DELETE("/batch", articleHandler.BatchDelete)
articlesProtected.PUT("/batch/status", articleHandler.BatchUpdateStatus)
```
这是超出第一轮建议的增强。

### CONTRACT-1-02 字段命名 —— ✅ 全部统一 camelCase
| DTO | 字段 | 修复前 | 修复后 |
|-----|------|--------|--------|
| UpdateArticleDTO | 封面图 | `cover_image` | `coverImage` ✅ |
| UpdateProfileDTO | 显示名 | `display_name` | `displayName` ✅ |
| UpdateProfileDTO | 头像 | `avatar_url` | `avatarUrl` ✅ |
| ChangePasswordDTO | 当前密码 | `current_password` | `currentPassword` ✅ |
| ChangePasswordDTO | 新密码 | `new_password` | `newPassword` ✅ |

全链路与前端 TS 类型对齐，定时炸弹已拆除。

### CONTRACT-1-03A 列表 Omit —— ✅
`article_repo.go:100` `query := r.db.Model(&article.Article{}).Omit("content")`，列表不再泄露全文。

---

## 🟡 附带发现

### CONTRACT-7-03：异步 IncrementViewCount 仍未加超时（SEC-1-07 复现）
`article_service.go:150-152`：
```go
go func() {
    _ = s.repo.IncrementViewCount(art.ID)  // 无 context，无超时，错误吞
}()
```
第一轮 SEC-1-07 指出的问题，在 article_service 这里**仍然存在**。高并发下 goroutine 堆积风险。

---

## 本轮结论

契约层的修复**方向正确、执行扎实**——id/slug 双路由、字段命名全统一、列表 Omit、批量操作增强，都是高质量的修复。但**漏掉了两个对用户体验影响最大的问题**：

1. **详情页 author/tags 永远为 null**——这是博客最核心的"文章详情页"显示残缺（没作者、没标签），用户一眼就能看出来。
2. **刷新即掉登录**——管理员用后台时频繁刷新就会被踢出，严重影响使用。

这两个问题的修复方式都很明确（Preload + AuthHydrator），且第一轮报告已给出具体代码，但本轮仍未实施。建议作为**下一轮修复的最高优先级**。
