# Spec — home-redesign

> Capability：前台首页 `/` 系统性重做。
> 范围：信息架构、组件拆分、视觉装饰、动效、文案一致化。
> 上游：`design-notes.md §6`、`design-research.md §5, §8`。
> 不动：`SiteHeader` / `SiteFooter` 主体结构、`PostCard` 的 props、API 数据来源。

---

## H-1 七段信息架构

### H-1.1 首页 DOM 顺序

**GIVEN** `src/app/(site)/page.tsx` 当前是 6 段（HeroEditorial → LaunchNarrative → TechStack → GithubCard → Recent → Stats）
**WHEN** 实施后
**THEN** DOM 顺序变为 7 段：`<HomeHero>` → `<HomeFeaturedAndRecent>` → `<HomeColumns>` → `<HomePrinciples>` → `<TechStack>` → `<GithubCard>` → `<HomeStats>`；用 `compareDocumentPosition` 测试断言顺序。

### H-1.2 旧组件替换

**GIVEN** 现有 `HeroEditorial`、`LaunchNarrative` 组件
**WHEN** 实施后
**THEN** `HeroEditorial` 重写为 `HomeHero`（名称差异避免 grep 混淆）；`LaunchNarrative` **保留**作为可复用 primitive，但**不再**直接挂在首页（其内容职责被 HomePrinciples 接管）；首页 page.tsx 不再 import LaunchNarrative。

---

## H-2 HomeHero（强叙事）

### H-2.1 三层文案结构

**GIVEN** `HomeHero` 组件
**WHEN** 渲染
**THEN** 包含：
- `<p class="hero-eyebrow">` mono 小字标签（如 `NOTES · v0.x · MAY 2026`）
- `<h1 class="hero-title">` 主标题（manifesto 风格，1 句，font-serif，text-hero size）
- `<p class="hero-lede">` 副标题（2-3 行 font-serif text-lead，max-w-[55ch]），说明博客是什么 / 给谁 / 你为什么应该往下看
- `<div class="hero-actions">` 双 CTA：`<Link href="/posts">Read posts</Link>` + `<Link href="/about">About me</Link>`，按钮风格遵循 admin-readability spec AR-4 的统一按钮系统。
- `<div class="hero-now">` 右上 / 末尾 mono 小字 "Now:" 状态行（如 `Now: writing on i18n, hardening deploy`）

文案具体内容由 implementation 协同 ha1den 起草，但必须含"个人/工程/克制"三关键词，不允许出现"hello world"或 "Welcome to my blog" 这种 placeholder。

### H-2.2 hero 视觉装饰

**GIVEN** HomeHero 渲染
**WHEN** 浏览器 view
**THEN** 背景至少包含：
- `launch-surface` radial gradient（保留）
- subtle dot grid（CSS background-image radial-gradient repeat，颜色 `hsl(var(--muted-fg) / 0.06)`，size 1px / 24px gap）
- grain noise overlay（SVG turbulence data:url，opacity 0.04）
- hero 主标题下方一条 1px border-bottom 当作 editorial divider

视觉装饰加在 hero 区独立容器内，不渗透到下方 section。

### H-2.3 hero 入场动效

**GIVEN** HomeHero mount
**WHEN** 用户首次访问首页
**THEN** eyebrow / title / lede / actions 依次 fade-up（800ms ease-out-expo，依次 0/100/200/300ms 延迟）；用 CSS animation + `data-reveal` 属性（保留现有 mechanism）；`prefers-reduced-motion` 时跳过动效。

### H-2.4 hero light/dark 视觉

**GIVEN** 切换 dark mode
**WHEN** hero 渲染
**THEN** background / decorations / text 颜色都用 token 自动切换；dot grid 在 dark mode 用更深的 `hsl(var(--muted-fg) / 0.04)`；noise overlay 透明度不变。

---

## H-3 HomeFeaturedAndRecent

### H-3.1 一篇 featured + N 篇 recent

**GIVEN** PUBLISHED 文章 ≥ 1 篇
**WHEN** `HomeFeaturedAndRecent` 渲染
**THEN**：
- 第一篇（按 publishedAt desc）展示为 **featured 大卡**：`aspect-[3/1]` cover、大字号 title（h2 size）、tags、reading time（可选）、excerpt（line-clamp-2）
- 接下来 5-8 篇（实现时取 7 篇）展示为 **recent list**（divide-y 风格，与 `/posts` 列表风格一致；保留现有 `PostCard` 但去掉 cover 缩略图以保持视觉节奏）
- 末尾 `Link` 指向 `/posts`，文案"所有文章 →"（保留中文，删除当前的"View all"英文版本——见 i18n-current-state §13）
- featured 与 recent 之间有 `var(--space-stack-lg)` 间距

### H-3.2 空状态

**GIVEN** 没有 PUBLISHED 文章
**WHEN** 渲染
**THEN** 显示 dashed border 空状态："还没有发布的文章。" + 引导链接到 `/admin/posts/new`（仅在已登录 admin 看到；普通访客无引导）。

### H-3.3 只取 PUBLISHED

**GIVEN** 数据库可能有 DRAFT / ARCHIVED
**WHEN** 查询
**THEN** 调用 `listPosts({ status: "PUBLISHED", page: 1, pageSize: 8 }, getCurrentLocale())`；DRAFT/ARCHIVED 不出现。

---

## H-4 HomeColumns

### H-4.1 专栏卡片网格

**GIVEN** 有 3+ Column 已发布
**WHEN** 渲染
**THEN** 显示 grid `sm:grid-cols-2 lg:grid-cols-3`，每张卡用 `launch-panel` primitive：
- column name（h3）
- 文章数（mono 小字 "12 articles"）
- description（line-clamp-2 font-serif）
- hover 时 translateY(-2px) + border-accent

至多显示 6 个（按 sortIndex asc）；其余在 `/columns` 总览。

### H-4.2 不显示空专栏

**GIVEN** 一个 column 有 0 篇 PUBLISHED 文章
**WHEN** 查询
**THEN** 该 column 不出现在 HomeColumns（与 `/columns` 行为一致）。

### H-4.3 标题与"全部"链接

**GIVEN** HomeColumns
**WHEN** 渲染
**THEN** section 顶部有 `<h2>专栏</h2>` 与 `<Link href="/columns">全部专栏 →</Link>` 并排（justify-between）。

---

## H-5 HomePrinciples

### H-5.1 4 条原则卡

**GIVEN** HomePrinciples 渲染
**WHEN** 浏览器 view
**THEN** section 顶部 `<h2>原则</h2>`；下面 grid `sm:grid-cols-2 lg:grid-cols-4`，4 张 `launch-panel`：
- 每张卡：mono 编号（`01 / 02 / 03 / 04`）+ heading（"Source-first publishing" / "Markdown is the source" / "Document tradeoffs" / "Self-host the whole loop"）+ 一句 detail（font-serif）
- 卡片有 `data-reveal` scroll-triggered fade-up
- hover translateY(-2px)

实际原则文案由 implementation 起草（基于 systemPatterns / about.ts 已有信念），不允许通用 "be nice be fast" 这种空话。

### H-5.2 与 About 的 AboutPrinciples 互不重复但呼应

**GIVEN** AboutPrinciples（about-redesign spec）有 6-8 条
**WHEN** 实施
**THEN** HomePrinciples 4 条 = AboutPrinciples 中**最强的 4 条**精选；不允许两边完全相同（首页是精选 hook，about 是详尽展开）；测试断言两边不 100% 重叠。

---

## H-6 TechStack 微调

### H-6.1 标题与简介

**GIVEN** 现有 `TechStack` 组件
**WHEN** 实施后
**THEN** section 顶部 `<h2>技术体系</h2>` + 一行 mono 小字简介（"5 areas, 30+ pieces, all self-hosted."）；不增删 5 个分类（Frontend / Content & Editor / Backend & Data / Infra / Tooling）；分类内顺序保留现状。

### H-6.2 每项加上 hover tooltip 或简短说明

**GIVEN** TechStack 项当前只有名称
**WHEN** 实施
**THEN** 每项 hover 时显示一行解释（如 "Next.js 16 — App Router + Server Actions"）；用 `<abbr title>` 或 shadcn Tooltip；不允许只有名称无说明。

### H-6.3 链接到 About 的 AboutTechStack

**GIVEN** TechStack section 末尾
**WHEN** 渲染
**THEN** 有 `<Link href="/about#tech-stack">完整技术选型理由 →</Link>`，引导读者深读。

---

## H-7 GithubCard 保留

### H-7.1 视觉

**GIVEN** 现有 `GithubCard` 组件
**WHEN** 实施
**THEN** 保留功能（avatar + recent commits + top repos + fallback states）；视觉用 `launch-panel` 容器统一；title 用 `<h2>GitHub Activity</h2>`。

### H-7.2 fallback 视觉强化

**GIVEN** API 限流 / token 缺失
**WHEN** fallback 渲染
**THEN** fallback 视觉与正常 card 高度等同（不影响 layout）；显示"GitHub data temporarily unavailable"中文版本"GitHub 数据暂不可用"（一致化）+ icon。

---

## H-8 HomeStats 改 mono 单行

### H-8.1 视觉简化

**GIVEN** 当前 SiteStats 单独 section
**WHEN** 实施
**THEN** Stats 改为 `<HomeStats>` mono 单行 footer-prelude，紧靠 SiteFooter 上方；内容："v0.x · 12 posts · 84 views in 7 days · last shipped May 2026"（mono 小字 + bullet 分隔）；CSS color `hsl(var(--muted-fg))`、font `var(--font-mono)`、size `var(--text-mono-sm)`；不允许出现 grid 多列大数字风格（那是 dashboard 不是 blog footer）。

### H-8.2 数据来源

**GIVEN** 现有 `getSiteStats()` 服务返回 views/posts/comments
**WHEN** 实施
**THEN** 复用 `getSiteStats()`；如新增需要的字段（如 "last shipped" = 最近 publishedAt）则在 service 内扩展，不允许在组件内查 DB。

---

## H-9 文案一致化

### H-9.1 删除英文 chrome 文案

**GIVEN** 当前首页同时出现 "所有文章" 和 "View all"
**WHEN** 实施
**THEN** 所有 chrome 文案统一中文（保留"GitHub Activity" / "Now" 等术语英文是可以的，但导航 label / "View all" / button text 都中文化）；具体 mapping 见 i18n-current-state §13。

### H-9.2 文案表（implementation 决定具体字符）

| 旧 | 新 |
|---|---|
| "View all" | "所有文章 →" / "全部专栏 →" |
| "Now:" | 保留（mono 状态行习惯用法） |
| "Read posts" | "阅读文章" 或保留英文（hero CTA 风格选择，implementation 决定，但需在 design-notes 末尾的 "调整日志" 记一笔） |
| "About me" | "关于我" 或保留英文 |
| "GitHub Activity" | 保留 |
| "Engineering Principles" | "原则" 或保留英文 |

执行方在实施时做最终决策，但**一篇文章 / 一页内不允许中英文混杂同义词**（H-9.1 红线）。

---

## H-10 性能

### H-10.1 首页 server-side render < 200ms

**GIVEN** 本地 dev DB 含 ~30 篇文章 / 5 个 column
**WHEN** GET `/`
**THEN** TTFB ≤ 200ms（不含 cold start）；`listPosts` / `listColumns` / `getSiteStats` / `getGithubStats` 全部并发查询（`Promise.all`）。

### H-10.2 CLS / LCP

**GIVEN** 首页加载
**WHEN** Chrome devtools Performance recording
**THEN** CLS ≤ 0.05；LCP ≤ 2.5s（本地）；hero 字号大但通过 font-display swap + preload 关键字体 OK。

---

## H-11 测试覆盖

### H-11.1 现有 page.test.tsx 改造

**GIVEN** `src/app/(site)/page.test.tsx` 现有 230 行 + 8 specs
**WHEN** 实施后
**THEN** 测试更新断言新 7 段 DOM 顺序；新增 spec：HomeColumns rendering / HomePrinciples rendering / Hero 文案 / Stats mono 单行 / 空状态空文章。

### H-11.2 各子组件单元测试

**GIVEN** 新组件 HomeHero / HomeFeaturedAndRecent / HomeColumns / HomePrinciples / HomeStats
**WHEN** 实施
**THEN** 每个组件至少 2-3 spec：渲染基本 / 空状态 / 视觉关键属性（hero-eyebrow 出现 / featured 大卡 cover 渲染 / 卡片 hover class 存在）。

### H-11.3 async RSC stub（按 systemPatterns §18）

**GIVEN** HomeFeaturedAndRecent / GithubCard 可能是 async RSC
**WHEN** 在 page.test 中
**THEN** 按 systemPatterns §18 mock 这些子组件为 sync stub；不允许把组件改回 sync 来"测得动"。
