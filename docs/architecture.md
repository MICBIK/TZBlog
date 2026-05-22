> Last verified: 2026-05-23

# 架构概览

TZBlog 是单体 Next.js 应用：公开前台、后台 CMS、REST API、自研 Analytics 共用一个 codebase 和一套 Prisma schema。

## 路由组

| 组 | 路径 | 用途 | 守卫 |
| --- | --- | --- | --- |
| `(site)` | `/`, `/posts/*`, `/columns/*`, `/tags/*`, `/about` | 公开内容页 | 无认证 |
| `(admin)` | `/admin/*`, `/login` | 后台 CMS 与登录页 | `/admin/*` 由 proxy 守 |
| `api/` | `/api/*` | REST API、Auth、Analytics 上报 | `/api/admin/*` 由 proxy 守 |

公开内容页使用 Server Component 直接读取数据；后台页面通过 admin API 和表格/表单组件完成管理操作。RSS、sitemap、robots 和文章 OG 图在 `src/app/` 下按 Next.js 文件约定实现。

## 数据访问

所有数据库访问从 `src/lib/db.ts` 导出的 Prisma client 进入。

- Server Component 可以直接 `await db.post.findMany(...)`，不额外包一层无意义 service。
- 只有跨多表业务流程才放进 `src/lib/services/*.ts`，例如文章列表聚合、评论审核、点赞、统计、媒体删除。
- 不写 Repository 模式；Prisma 已经承担查询 DSL、类型和事务边界。
- 写入计数器、评论状态流转、媒体删除这类流程要用事务或明确的 service 函数承载业务规则。

## API 响应格式

成功响应：

```json
{ "data": {}, "meta": { "total": 0, "page": 1, "limit": 20 } }
```

失败响应：

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }
```

API 入口先用共享 zod schema 校验 body/query，再把业务异常交给统一错误处理。边界层可以捕获 unknown，业务层不要用 `try/catch + console.error + 返回空值` 吞错。

## Auth (Auth.js v5)

认证使用 Auth.js v5 Credentials provider，管理员账号由 seed 初始化，密码 hash 存数据库。

- `/login` 公开。
- `/admin/*` 未登录时重定向到 `/login?from=...`。
- `/api/admin/*` 未登录时返回 `401` JSON。
- 普通公开 API 不需要登录，但点赞、评论、Analytics 上报需要 visitorHash 和 rate-limit。

## 主题

主题由 Tailwind CSS v4 和 CSS variables 驱动。变量定义在 `src/app/globals.css` 的 `@theme` 块。

常用语义变量：

```css
--bg;
--fg;
--muted;
--accent;
--border;
--ring;
--primary;
--destructive;
```

组件里优先使用语义 class 或 `hsl(var(--token))`，避免硬编码 `#fff`、`rgb(...)`、`bg-red-500` 这类固定颜色。

## i18n

MVP 当前 locale 固定为 `"zh"`。需要翻译的内容字段抽到 `*Translation` 子表，并通过 `(parentId, locale)` 唯一约束保证每个实体每个语言只有一份内容。

查询时使用 `getCurrentLocale()` 或等价封装拿当前 locale，再在 translations 查询中加 `where: { locale }`。V3 再从 URL 加 `/en/...` 之类的多语言路由。

## 计数器

高频读取的计数器内嵌在 `Post`：

- `viewCount`
- `likeCount`
- `commentCount`

写入时在事务内做增减。详情表保留原始事件用于去重、审核和分析：

- `PostView` 记录浏览事件。
- `PostLike` 记录点赞唯一性。
- `Comment` 记录评论及审核状态。

评论计数只统计 `APPROVED` 评论；PENDING、SPAM、REJECTED 不展示到前台计数。

## 反垃圾

访客指纹：

```text
visitorHash = sha256(ip + userAgent + dailySalt)
```

用途：

- 浏览去重：同访客、同文章、同天只计一次有效浏览。
- 点赞：同访客、同文章永久唯一。
- 评论：同 visitorHash 5 分钟最多 3 条，后台审核后才展示。
- Analytics：`/api/track` 记录 path、referrer、userAgent 解析结果和 visitorHash。
