# System Patterns — TZBlog

约束这个项目「代码长什么样」的统一规则。所有 `.claude/sdd` feature / ECC 实现都要遵守。

## 1. 应用形态：单体（不是 monorepo）

- 根目录就是 Next.js 工程，**没有** `apps/` 或 `packages/`。
- 旧版 `apps/web` (Astro) + `apps/cms` (Payload) 的双仓结构已废弃。
- 前台 / 后台 / API 同一个 codebase，同一次部署。

## 2. 路由组织

```
src/app/
├── (site)/        # 前台公开页面，无认证守卫
│   ├── page.tsx           首页
│   ├── posts/...
│   ├── columns/[slug]/
│   ├── tags/[tag]/
│   └── layout.tsx          前台 Header/Footer
├── (admin)/       # 后台管理，proxy 守卫
│   ├── admin/
│   │   ├── posts/
│   │   ├── columns/
│   │   ├── comments/
│   │   ├── media/
│   │   ├── analytics/
│   │   └── layout.tsx       后台 Sidebar
│   └── login/page.tsx
└── api/
    ├── auth/[...nextauth]/
    ├── posts/[slug]/
    │   ├── view/route.ts    POST  浏览上报
    │   ├── like/route.ts    POST/DELETE
    │   └── comments/route.ts GET/POST
    ├── admin/               所有需要 admin 权限的 API
    │   ├── posts/
    │   ├── comments/        审核操作
    │   └── analytics/
    ├── track/route.ts        POST  全局 PageView 上报
    ├── media/upload/route.ts
    └── rss.xml/route.ts
```

- `proxy.ts` 守 `/admin/*` 和 `/api/admin/*`，未登录 → `/login?from=...`
- 普通用户 API 不需要鉴权，但要 rate-limit（按 IP）

## 3. 数据访问

- 所有 DB 操作走 `src/lib/db.ts` 导出的 Prisma client。
- Server Component 直接 `await db.post.findMany(...)`，**不要**包装无意义的 service 层。
- 只有「跨多张表的业务流程」（如：发表评论 → 反垃圾检查 → 写 Comment + 更新 commentCount）才拆 `src/lib/services/*.ts`。
- 不写 Repository 模式，Prisma 自己就是。

## 4. API 响应契约

**成功**：
```json
{ "data": <T>, "meta": { ... } }
```

**失败**：
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {...} } }
```

- 状态码：200 成功 / 400 校验失败 / 401 未登录 / 403 无权限 / 404 不存在 / 429 限流 / 500 内部错误
- 所有 API 入口先用 `zod.parse(body)`，失败抛 `AppError("VALIDATION_ERROR", ...)`
- 全局 `withErrorHandler` 高阶函数把异常统一成上面格式

## 5. 错误处理

- 业务异常用自定义 `AppError`（`src/lib/errors.ts`），带 `code` + `httpStatus`
- 边界外（DB 连接挂、外部 API 超时）→ 在调用点 try/catch，转成 `AppError("UPSTREAM_FAILURE", ...)`
- **不要**用 `try/catch + console.error + 返回空值` 吞错。silent failure 是禁忌。

## 6. 表单 & 校验

- 所有表单用 `react-hook-form` + `@hookform/resolvers/zod`
- **schema 写一份，前后端共享**：`src/lib/schemas/post.ts` 既给后端 API 验，也给前端表单验
- 服务端必须再 validate 一次（防绕过）

## 7. i18n 数据模型约定

所有需要翻译的内容字段抽到 `*Translation` 子表：

```prisma
model Post { ... translations PostTranslation[] }
model PostTranslation {
  postId String
  locale String              // "zh" | "en" | ...
  title  String
  ...
  @@unique([postId, locale])
}
```

- 查询时一律 `where: { locale: currentLocale }`
- 当前 locale 由 `src/lib/i18n.ts` helper 提供；MVP 当前实现仍是单 locale，`getCurrentLocale()` 固定返回 `zh`
- **不要**在主表里塞 `titleZh / titleEn` 列

### V3 locale routing direction

- 必须作为 V3 独立 SDD 实施，不能在普通 UI polish 中局部改。
- 采用 Next.js App Router locale routing：优先评估 `app/[lang]` route segment，让 public 页面、metadata、RSS、sitemap、OG 图都能从 params 取得 locale。
- 静态 UI 文案走 dictionary，不再把中文/英文硬编码散落在组件里。
- `proxy.ts` 只做 locale negotiation / redirect 时必须保留 admin/auth/API guard 现有行为。
- `metadata / RSS / sitemap` 必须同时输出 locale-aware URL、canonical、alternate links；避免只翻译页面内容但 SEO/feed 仍指向单 locale。
- V3 完成前，`SUPPORTED_LOCALES = ["zh", "en"]` 只代表数据模型预留，不代表站点已经完成多语言支持。

## 8. 主题系统（CSS 变量 first）

- **从 P0 开始** 所有颜色都用 CSS 变量：`color: hsl(var(--fg))` 而不是 `color: #000`
- 变量定义在 `src/app/globals.css` 的 `@theme` 块
- V2 加主题切换：只换 `:root[data-theme="solar"]` 下的变量值，组件零修改
- 命名约定：`--bg / --fg / --muted / --accent / --border / --ring` 等语义化，**不要** `--blue-500`

## 9. 计数器策略

高频读、低频写的字段（浏览/点赞/评论数）：

- Post 内嵌 `viewCount`, `likeCount`, `commentCount` 三个 `Int @default(0)`
- 写入时事务内 `update post SET ...count = ...count + 1`
- 详情表（`PostView` / `PostLike` / `Comment`）记录原始数据，用于去重 + 后台审计
- 不每次 `count(*)` 主表关联

## 10. 反垃圾 visitor 指纹

- `visitorHash = sha256(ip + userAgent + dailySalt)`
- `dailySalt` 是当天 0 点的 UTC 时间戳字符串
- 用于：浏览去重（同访客 + 同文章 + 同天 = 一次）/ 点赞唯一约束 / 评论限流
- IP 由 Caddy 通过 `X-Forwarded-For` 传给 Next，`src/lib/visitor.ts` 解析

## 11. 评论审核流

```
访客提交 → 默认 status=PENDING → 后台审核 → APPROVED / SPAM / REJECTED
                                                      ↓
                                              APPROVED 才 commentCount++
                                              并显示在前台
```

- 限流：同 visitorHash 5 分钟内最多 3 条
- 关键词黑名单（简单 string contains），命中直接 `status=SPAM`，不进队列
- 后台批量审核：列表多选 → 批量 approve/spam

## 12. 自研分析（替代 Umami）

- 客户端 `<AnalyticsBeacon>` 注入到前台 layout，路由变化时（含初次）发 `POST /api/track`
- 服务端写 `PageView` 表，**不阻塞**响应（fire-and-forget）
- 字段：path / visitorHash / referrer / userAgent / 解析后的 device/browser/os
- 仪表盘聚合查询：`@@index([createdAt])` + `@@index([path, createdAt])` 撑住中小流量
- IP 地理：MVP 不做（可选 V2 接 ip2c 或 maxmind）

## 13. Markdown 渲染管道

```
content (Markdown 字符串)
  → remark-parse
  → remark-gfm（GitHub 风味）
  → remark-rehype
  → rehype-slug（标题加 id）
  → rehype-autolink-headings（标题 anchor）
  → rehype-shiki（代码高亮，主题与站点主题联动）
  → rehype-stringify
  → HTML 字符串 → dangerouslySetInnerHTML 渲染
```

- 渲染结果用 React Server Component 缓存（`unstable_cache`），key = postId + locale + updatedAt
- 用户提交的 Markdown 永远先经 sanitize（rehype-sanitize），防 XSS

## 14. 编辑器契约

- 管理端编辑体验是 Markdown source editor + split preview；编辑区必须保留 Markdown 原文，预览区只做草稿态辅助。
- 存储格式永远是 Markdown 字符串；后端永远收 Markdown，不收 JSON。
- 当前编辑层仍保留 Tiptap v3 + `tiptap-markdown` round-trip 依赖；如果要彻底替换为 textarea/source editor，必须单独 SDD 并覆盖工具栏、光标行为、有序列表和 heading 回归。

## 15. Git 提交规范

- 用 Conventional Commits：`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `test:`
- ECC TDD 流程中的 checkpoint：
  - `test: add tests for <feature>` (RED)
  - `feat: implement <feature>` (GREEN)
  - `refactor: clean up <feature>` (REFACTOR)
- 一个 SDD feature 一组 commit，不混 feature

## 16. 文件命名

- 组件 PascalCase：`PostCard.tsx`
- 普通文件 camelCase：`useDebounce.ts` / `markdown.ts`
- 路由文件按 Next 约定：`page.tsx` / `layout.tsx` / `route.ts`
- 测试文件 `*.test.ts` 与被测文件同目录

## 17. SEO/feed 缓存策略

- `/sitemap.xml` 与 `/rss.xml` 使用 `export const revalidate = 600`，以 10 分钟为基准缓存窗口。
- 理由：搜索引擎与 RSS reader 不需要秒级实时性；10 分钟足够覆盖发布后可见性，同时避免爬虫高频访问时每次打 Postgres。
- 文章发布/更新路径仍写 DB 为准；缓存过期后由 Next 重新生成，避免额外 cache invalidation 复杂度。

## 18. async RSC 在 vitest 页面级集成测试

### 问题

React 19 的 server component 允许 `export async function Foo()` 直接 await 数据再返回 JSX。`render(await Foo())` 在单元测试里没问题（外层先 await，再把已 resolve 的 JSX 树丢给 RTL）。

但**一旦 async RSC 出现在另一个 RSC 的 children 位置**（典型场景：`<HomePage>` 里写 `<GithubCard />`），vitest 的 jsdom + React 渲染器无法在测试时把内嵌 async 组件展开，会抛：

```
<Foo> is an async Client Component. Only Server Components can be async at the moment.
A component suspended inside an `act` scope, but the `act` call was not awaited.
```

整个父页面的所有测试连锁崩溃，不只是新加的那个。

### 解法（项目内统一模式）

**在父页面的 test 文件里，用 `vi.mock` 把那个 async 子组件整体替换成 sync 桩**，不要去 mock 它内部依赖的 service。桩组件渲染最少够断言用的标签 / `data-testid` 即可。

```ts
vi.mock("@/components/site/Foo", () => ({
  Foo: () => (
    <section data-testid="foo-stub">
      <h2>FOO · LABEL</h2>
    </section>
  ),
}));
```

集成测试只断言**接线**（导入路径、DOM 顺序、props 透传），不断言 Foo 内部 UI（那是 `Foo.test.tsx` 的事）。

### 先例

- `src/app/(site)/posts/[slug]/page.test.tsx` — mock 异步 `CommentSection`
- `src/app/(site)/page.test.tsx` — mock 异步 `GithubCard`

### 何时套用 / 何时不套用

| 情形 | 套用 §18 |
|---|---|
| async RSC 嵌在另一个被 vitest 直接 render 的 RSC 里 | ✅ |
| async RSC 是顶层、测试直接 `render(await Foo())` | ❌ 不需要，单元测试照常 |
| 子组件是 sync（`export function Foo()`），即使父是 async | ❌ 不需要 |
| Server Action / `use server` 函数 | ❌ 另一套 mock 思路 |

### 不要做的事

- 不要为了"测得动"把 `export async function` 改回 sync + 把 await 上提到父组件 — 那是用业务代码迁就测试工具，反了。
- 不要在 page 级 test 里直接 mock async 子组件**依赖的 service**（如本例 `@/lib/services/github`）— mock 了 service，组件仍然是 async，问题没解决。
- 不要在 jsdom 里强行加 `<Suspense>` 兜底 — RTL 的 act 流和 React 19 RSC 的解析阶段不在同一根上。

### 等什么时候可以删掉这一节

当 vitest / `@testing-library/react` 官方明确支持 async RSC 作为 children 渲染（届时 React 19 RSC + jsdom 集成成熟），上述桩可以拆掉，测试直接 render。在此之前，这是 TZBlog 推荐做法。
