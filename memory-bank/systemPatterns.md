# System Patterns — TZBlog

约束这个项目「代码长什么样」的统一规则。所有 OpenSpec change / ECC 实现都要遵守。

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
├── (admin)/       # 后台管理，middleware 守卫
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
    ├── analytics/
    │   └── pageview/route.ts POST  全局上报
    ├── media/upload/route.ts
    └── rss.xml/route.ts
```

- `middleware.ts` 守 `/admin/*` 和 `/api/admin/*`，未登录 → `/login?from=...`
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
- 当前 locale 由 `src/lib/i18n.ts` 中间件解析（MVP 写死 "zh"，V3 从 URL 解析）
- **不要**在主表里塞 `titleZh / titleEn` 列

## 8. 主题系统（CSS 变量 first）

- **从 P0 开始** 所有颜色都用 CSS 变量：`color: hsl(var(--fg))` 而不是 `color: #000`
- 变量定义在 `src/styles/globals.css` 的 `@theme` 块
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

- 客户端 `<AnalyticsBeacon>` 注入到根 layout，路由变化时（含初次）发 `POST /api/analytics/pageview`
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

## 14. 编辑器（Tiptap）契约

- Tiptap 内部 state 是 ProseMirror JSON，**存储格式是 Markdown 字符串**
- 序列化：`tiptap-markdown` 扩展，editor.storage.markdown.getMarkdown()
- 反序列化：editor.commands.setContent(markdown)
- 后端永远收 Markdown，不收 JSON

## 15. Git 提交规范

- 用 Conventional Commits：`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `test:`
- ECC TDD 流程中的 checkpoint：
  - `test: add tests for <feature>` (RED)
  - `feat: implement <feature>` (GREEN)
  - `refactor: clean up <feature>` (REFACTOR)
- 一个 OpenSpec change 一组 commit，不混 feature

## 16. 文件命名

- 组件 PascalCase：`PostCard.tsx`
- 普通文件 camelCase：`useDebounce.ts` / `markdown.ts`
- 路由文件按 Next 约定：`page.tsx` / `layout.tsx` / `route.ts`
- 测试文件 `*.test.ts` 与被测文件同目录
