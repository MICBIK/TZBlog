# tzblog 剩余工作交付文档（移交给后端 / 构建工程 / 另一 AI 执行）

> 版本：2026-06-01 · 作者侧：haiden · 适用：本前端原型 (`/.od/projects/.../`) 已完成静态可交互界面后的后续实现
> 配套阅读：`docs/frontend-handoff.md`（前端实现手册）、`docs/production-readiness-checklist.md`（上线就绪清单）
> 阅读对象：接手的后端工程师 / 构建工程师 / 另一个 AI 代理

---

## 0. 当前状态与本文件定位

本前端是**静态 HTML 原型**（16 + 4 页，终端暗色主题，纯客户端交互，无后端、无持久化、无构建）。
前端可做的部分**已全部完成**（见 §1 已交付清单）。本文件列出的是**当前原型环境做不了、需要后端 / 构建 / 运行时 / 平台能力的剩余工作**，每项给出目标、验收标准、技术建议与接口指引，供接手方直接执行。

**关键边界（务必先读）**：
- 原型中所有数据均为**写死的 mock**（`POSTS`、`DATA` 等内联数组）。
- 接口契约（`docs/frontend-handoff.md` §6/§7）中标 `[建议]` 的端点**尚未存在**，是按前端交互推导的待实现契约。
- `auth.html` 是静态表单，**没有**真实 OAuth 回调 / session / JWT / CSRF。
- 搜索（`front-search.html`）是客户端 `filter`，**未接** Meilisearch。
- 编辑器（`admin-editor.html`）的 Markdown 预览是**手写正则 mock**，不是生产渲染管线。

---

## 1. 已交付（前端原型层，本轮全部完成，无需接手方重做）

| 模块 | 文件 | 说明 |
|---|---|---|
| 404 错误页 | `404.html` | 终端 "command not found" 主题，自动回显来源路径，挂 site-chrome |
| 500 错误页 | `500.html` | 终端 stack-trace 主题，retry / 回首页 CTA |
| 文章归档页 | `archive.html` | 分类 / 标签 / 年份三视图，客户端聚合过滤，支持 `?by=` 深链 |
| 个人中心 | `account.html` | 已登录态 mock：资料卡 + 统计 + 收藏/点赞/评论/历史 tabs |
| 统一底栏 | `assets/site-chrome.{css,js}` | 单一数据源，JS 注入，全前台页一致 |
| 统一后台侧栏 | `assets/admin-chrome.{css,js}` | 单一数据源，canonical 导航 + 按文件名高亮 |
| 全站特效 | site-chrome | 背景动效 / 主题光标 / 点击字符掉落 / 加载动画 / 报错提示条 / 视图过渡 |

> 这些是纯前端、不依赖后端的部分。接手方**不要重做**，只需在真实框架迁移时移植。

---

## 2. 剩余工作 — 后端 / 数据层（P0，上线必须）

### 2.1 真实 API + 数据库 + 持久化
- **目标**：把所有 mock 数组替换为真实接口。按 `docs/frontend-handoff.md` §6 实现 RESTful 端点，统一响应信封 `{ success, data?, error?, meta? }`。
- **技术建议**（与项目既定栈一致）：Go + Postgres，Docker 部署。表结构见 §7 数据模型与 handoff §7。
- **核心端点**（最小集）：
  - `GET /api/posts?page=&size=&cat=&tag=&year=&sort=` → 列表 + 分页 meta
  - `GET /api/posts/{slug}` → 正文（含渲染后 HTML 或原始 Markdown，见 §3）
  - `GET /api/posts/pinned` → 首页置顶（后台可配，见 §5）
  - `GET /api/categories` / `GET /api/tags` → 归档页聚合数据（替换 `archive.html` 的 `POSTS`）
  - `POST /api/comments` / `GET /api/posts/{slug}/comments` → 评论（含审核态、嵌套回复）
  - `POST /api/posts/{slug}/like` / `/bookmark` → 点赞/收藏（需登录）
  - `GET /api/me/{collections|likes|comments|history}` → 个人中心数据（替换 `account.html` 的 `DATA`）
  - `GET /api/stats` → 站点统计（替换首页侧栏 + 后台 dashboard mock）
- **验收**：前端把内联 mock 数组换成 `fetch`，页面渲染不变。

### 2.2 鉴权（OAuth + 邮箱 + Magic Link）
- **目标**：实现 `auth.html` 表单背后的真实登录。
- **方案**（项目既定）：GitHub OAuth（优先）+ Google OAuth + 邮箱密码 + Magic Link；**排除**短信/微信/微博/QQ。
- **必做**：OAuth 回调路由、session 或 JWT 签发、CSRF token、登录态中间件、分级权限（匿名可读 → 注册解锁点赞/收藏/下载/跨端同步）。
- **验收**：`account.html` 在未登录时重定向到 `auth.html`；登录后顶栏 `login` 按钮换成头像入口。

### 2.3 全文搜索（Meilisearch）
- **目标**：替换 `front-search.html` 的客户端 `filter`。
- **方案**：Meilisearch 索引 `posts`（title/excerpt/body/tags），`GET /api/search?q=&cat=` 代理查询，返回高亮片段。
- **验收**：搜索结果由后端返回，支持中文分词、拼写容错。

### 2.4 图片 / 媒体上传管线
- **目标**：`admin-media.html` 媒体库 + `admin-editor.html` 插图改为真实上传。
- **方案**：`POST /api/media`（multipart）→ 存对象存储（S3/OSS/R2）→ 返回 URL；缩略图生成、格式转换（WebP/AVIF）。
- **验收**：编辑器插入图片返回可访问 URL，媒体库列表来自后端。

---

## 3. 剩余工作 — Markdown 渲染管线（P0，决策已定）

> **决策结论（已与作者确认）**：保留 **Markdown** 路线，**不**上 Tiptap。理由：作者是代码密集型开发者、Shiki/KaTeX 既定、纯文本可 git diff 易沉淀。原型里的手写正则解析器仅为 mock，生产须替换为正经管线。

- **编辑区**：`CodeMirror 6`（markdown 模式：行号、语法着色、快捷键），替换 `admin-editor.html` 的裸 `textarea`。
- **渲染管线（预览与发布共用同一条，保证所见即所得）**：
  `remark-parse → remark-gfm → remark-math → rehype → rehype-katex → rehype-shiki(or rehype-pretty-code) → rehype-stringify`
- **要点**：
  - 预览（编辑器右栏）与发布（文章页）必须走**同一条**管线，否则一致性会漂移。
  - 用户提交内容须 **sanitize**（`rehype-sanitize` 或服务端 DOMPurify）防 XSS。
- 代码高亮主题与站点终端绿主题对齐（Shiki 自定义主题）。
- **验收**：在编辑器写 ```代码块```、`$公式$`、表格、callout，预览与最终文章页渲染完全一致。

---

## 4. 剩余工作 — 前端打磨（需改既有大文件，原型层可做但本轮未做，建议接手方或下一轮完成）

> 这些是**前端范畴**，未在本轮做的原因是需要逐页编辑 16 个既有大文件 / 改动已上线共享层有风险，宜在框架迁移时一并做。

| 项 | 优先级 | 规格 / 验收 |
|---|---|---|
| **逐页 SEO 标记** | P0 | 每页 `<head>` 补 `description` / Open Graph / Twitter Card / JSON-LD（Article/BreadcrumbList/WebSite）/ `<link rel=canonical>`。文章页 JSON-LD 用真实 `datePublished`/`author`。 |
| **a11y 全站增强（共享层）** | P0 | `site-chrome.css` 加 skip-link、`:focus-visible` 高对比环、`prefers-reduced-motion` 补全；核对磷光绿 `#3fe08f` on `#0b0f14` 对比度达 WCAG AA；所有交互元素可键盘到达。 |
| **打印样式** | P2 | 文章页 `@media print`：隐藏顶/底栏与特效，正文黑白可读。 |
| **评论嵌套回复 / 举报态 UI** | P1 | 文章页评论区支持二级回复缩进、举报按钮、"待审核"标签（UI 层，逻辑接 §2.1）。 |
| **列表分页 / 加载更多** | P1 | 首页、归档、搜索结果接 §2.1 的 `meta.page`；客户端"加载更多"或页码。 |
| **表单前端校验** | P0 | `auth.html`（邮箱格式、密码强度、必填）、`admin-settings.html`（URL/备案号格式）实时校验 + 错误态。 |
| **移动端逐页核对** | P0 | 360/390/430/768/1024 无横向滚动；后台表格窄屏可横滑或卡片化；编辑器三栏窄屏降级为单栏 + tab。 |
| **亮色主题（可选）** | P2 | 若需，基于 token 加 `[data-theme=light]` 变量集 + 切换持久化。当前仅暗色终端风。 |

---

## 5. 剩余工作 — 后台功能闭环（P1）

- **板块管理 + 首页置顶可配**：`admin-sections.html` 的板块 CRUD 与置顶选择器目前是 mock UI。需接 `POST/PUT/DELETE /api/categories`、`PUT /api/posts/pinned`（写置顶集合，首页 `GET /api/posts/pinned` 读取）。
- **站点设置持久化**：`admin-settings.html` 各分组（站点身份/SEO/社交/评论开关/ICP 备案号/RSS/分析）接 `GET/PUT /api/settings`。
- **数据分析真实接入**：`admin-analytics.html` 图表换成真实埋点数据源（自建或接 Plausible/Umami 等）。

---

## 6. 剩余工作 — 工程化 / 构建 / 基础设施（P1）

| 项 | 说明 |
|---|---|
| **框架迁移** | 原型是自包含 HTML；生产迁移到 **Next.js**（项目既定）：组件化（顶栏/底栏/侧栏/卡片/按钮已是天然组件边界）、App Router 路由、SSG/SSR、数据层。 |
| **公共 bundle 抽取** | 当前每页内联 CSS/JS（为绕开旧共享层），生产须抽公共样式/脚本 + 缓存，消除重复加载。 |
| **设计 token 落地** | 把 `:root` 变量沉淀为 CSS 变量集或 Tailwind config 单一来源。 |
| **字体策略** | JetBrains Mono + Noto Sans SC 子集化、`font-display:swap`、自托管避免 FOUT。 |
| **RSS / sitemap / robots** | 服务端按文章数据生成 `rss.xml` / `sitemap.xml` / `robots.txt`。 |
| **安全** | CSP（nonce）、安全响应头（HSTS/X-Content-Type-Options/Referrer-Policy）、评论与 Markdown sanitize、接口 rate limiting。 |
| **测试** | 单元（工具/解析）、集成（API）、E2E（Playwright：登录→读文→搜索→评论）、视觉回归。 |
| **CI/CD + 监控** | 构建/测试/部署流水线；错误监控（Sentry）、可用性与性能（Core Web Vitals）监测。 |

---

## 7. 数据模型（供建表参考，详见 frontend-handoff §7）

```
Post     { id, slug, title, excerpt, body_md, body_html, cover, cat_id, tags[], status(draft|published), pinned(bool), reading_time, views, likes, published_at, updated_at }
Category { id, name, slug, order, post_count }
Tag      { id, name, slug, post_count }
Comment  { id, post_id, parent_id(nullable), user_id, body, status(pending|approved|spam), created_at }
User     { id, handle, email, avatar, provider(github|google|email), role(reader|admin), created_at }
Pathway  { id, title, slug, steps:[{post_id, level, est_min}] }
Media    { id, url, thumb, mime, size, width, height, uploaded_at }
Settings { site_name, author, domain, seo:{...}, social:{...}, comment_enabled, icp, rss_enabled, analytics:{...} }
```

---

## 8. 接手优先级建议（先做这些能最快"跑起来"）

1. **P0** §2.1 文章/分类/评论 API + §2.2 鉴权 → 前端 mock 一次性切真实数据
2. **P0** §3 Markdown 管线（CodeMirror + remark/rehype/Shiki/KaTeX）→ 写作-发布闭环
3. **P0** §4 SEO 标记 + a11y + 移动端核对 → 可被搜索引擎与无障碍访问
4. **P1** §5 后台闭环 + §2.3 搜索 + §2.4 媒体 → 运营可用
5. **P1** §6 框架迁移 + 安全 + 测试 + CI/CD → 真正可上线

> 每完成一项，回到 `docs/production-readiness-checklist.md` 勾掉对应条目。
