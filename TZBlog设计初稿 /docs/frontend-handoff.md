# tzblog 前端交付手册（Frontend Handoff）

> 面向对象：接手的前端工程师 + 实现后端的工程师。
> 文档目标：看完即可知道「界面怎么设计的、各板块用了什么效果、功能如何对接接口、各类数据怎么传」。
>
> **重要前提（请先读）**：当前仓库是一套**静态高保真原型**（纯 HTML + 内联 CSS/JS，无构建、无运行时后端）。所有列表、统计、评论、检索结果均为页面内置的 mock 数据。本文「接口契约」章节是**根据原型交互推导出的建议契约**，供后端实现与前端对接参考，并非已存在的线上接口。凡推导性内容均标注 `[建议]`；凡原型中已真实实现的交互标注 `[已实现]`。

---

## 1. 项目概览

| 项 | 内容 |
|---|---|
| 站点名 | tzblog |
| 作者 IP | haiden |
| 主域名 | tzcode.top |
| 定位 | 中文优先的技术与生活博客（AI Coding / 全栈工程 / 工具效率 / 随笔 / 作品） |
| 受众优先级 | 中文技术圈 > 海外华人 > SEO 流量 |
| 视觉主题 | 终端暗色（near-black `#0b0f14` 画布 + 单一磷光绿 `#3fe08f` accent + 命令行语义） |
| 字体 | 标题/正文 Noto Sans SC（`--sans`），代码/元信息 JetBrains Mono（`--mono`） |

### 1.1 计划技术栈（来自产品决策，后端实现请对齐）

- 前端框架：Next.js 15（App Router）+ React 19
- 后端：Go
- 数据库：PostgreSQL
- 全文搜索：Meilisearch
- 代码高亮：Shiki　｜　公式渲染：KaTeX
- 部署：Vercel（前端）+ Docker（后端）
- 鉴权：GitHub OAuth（优先）+ Google OAuth + 邮箱密码 + magic-link；**不做**短信/微信/微博/QQ

### 1.2 权限分级

| 角色 | 权限 |
|---|---|
| 匿名 | 全文可读（SEO 友好），可搜索、可浏览所有公开内容 |
| 注册用户 | 在匿名基础上解锁：点赞、收藏、下载、跨设备同步、发表评论 |
| 管理员（站长） | 后台全部能力：写作、板块管理、置顶配置、媒体库、数据分析、站点设置 |

---

## 2. 目录结构

```
项目根/
├── index.html   启动器 / 总览入口（链接到全部界面）
├── landing.html     营销落地页
│
├── front-home.html       前台·首页（文章流 + 侧栏 6 模块）
├── front-article-tutorial.html 前台·文章详情页（阅读核心页）
├── front-search.html     前台·全文搜索
├── front-library.html        前台·归档 + 书架
├── front-works.html       前台·作品集
├── front-pathways.html         前台·学习路径
├── front-about.html      前台·个人主页 / 关于
│
├── admin-dashboard.html        后台·概览仪表盘
├── admin-editor.html  后台·Markdown 写作 + 实时预览
├── admin-sections.html         后台·板块管理 + 首页置顶配置
├── admin-analytics.html        后台·访问数据分析
├── admin-media.html      后台·媒体库
├── admin-settings.html    后台·站点设置
│
├── auth.html    登录 / 注册
│
├── assets/
│   ├── site-chrome.css         【单一数据源】共享底栏 + 背景动效 + 光标 + 点击/加载/报错
│   ├── site-chrome.js          【单一数据源·前台】注入底栏 + 初始化全部全站特效
│   ├── admin-chrome.css    【单一数据源·后台】统一后台侧栏样式
│   ├── admin-chrome.js         【单一数据源·后台】注入 canonical 侧栏导航 + 按当前文件名高亮
│   ├── tzblog-ui.css           遗留共享样式（旧主题，页面已迁离，保留备查）
│   └── tzblog-ui.js    遗留共享脚本（同上）
│
└── docs/
    └── frontend-handoff.md     本文档
```

### 2.1 架构原则（务必理解）

1. **每个页面自包含**：token（`:root`）、页面专属 CSS、页面专属交互 JS 全部内联在各自 `.html` 内。这样做的历史原因是早期共享样式表（`tzblog-ui.css`）出过主题串台问题，遂改为自包含彻底隔离。
2. **共享外壳层是例外**：全站一致的东西统一抽到共享层，每页两行引用接入，避免重复与漂移。前台用 `assets/site-chrome.{css,js}`（底栏、背景动效、光标、点击/加载/报错）；后台用 `assets/admin-chrome.{css,js}`（统一侧栏导航 + 当前页高亮）。两层职责分离，互不注入对方页面。
3. **侧栏/底栏是数据驱动的单一数据源**：底栏 HTML 在 `site-chrome.js` 的 `FOOTER` 常量；后台侧栏菜单在 `admin-chrome.js` 的 `NAV` 数组。改导航项只改这一处，6 个后台页同步生效——不要再在页面里手写侧栏副本（早期就是 6 份手写副本导致「板块与置顶」只在部分页出现的漂移 bug）。
4. 迁移到真实工程时：第 1 点的「页面专属内联」应拆为 Next.js 组件 + CSS Module / Tailwind；第 2 点的 chrome 层对应根布局 `app/layout.tsx`（前台）与 `app/(admin)/layout.tsx`（后台）里的全局 Layout/导航组件。

---

## 3. 设计系统（Design Tokens）

每个页面 `:root` 内定义同一套 token（值一致）。迁移真实工程时建议提为全局 CSS 变量或 Tailwind theme。

```css
:root{
  /* 背景层次 */
  --bg:#0b0f14;        /* 页面底色 near-black */
  --panel:#11171f;     /* 一级面板 */
  --panel-2:#141b24;   /* 二级面板 / 卡片 */
  --line:#1f2730;      /* 分割线 */
  --line-2:#2a343f; /* 强分割线 / 边框 */
  /* 文本 */
  --fg:#c9d4df;        /* 正文 */
  --fg-strong:#eef3f8; /* 强调文本 / 标题 */
  --muted:#6b7a89;     /* 次要文本 */
  --dim:#48555f;       /* 最弱文本 / 标签 */
  /* accent（唯一彩色，节制使用） */
  --acc:#3fe08f;       /* 磷光绿——全站唯一 chromatic accent */
  --acc-dim:#1f7a4d;   /* accent 暗态（边框/hover） */
  --amber:#e3b341;     /* 琥珀色，仅个别状态用一次 */
  /* 字体与圆角 */
  --mono:'JetBrains Mono', ui-monospace, monospace;
  --sans:'Noto Sans SC', system-ui, sans-serif;
  --r:6px;             /* 统一圆角 */
}
```

设计纪律：

- **单 accent**：磷光绿每屏最多用两处（通常是 eyebrow/prompt + 主操作）。其余靠灰阶层次。
- **命令行语义**：导航、搜索框、区块标题大量使用 `$`、`❯`、`tzblog ❯`、`$ ls -t posts/` 等终端提示符表达层级。
- **内容宽度**：顶栏与底栏内容宽 `1320px`，正文阅读列 `1080px`（利于长文阅读）。
- **等宽数字**：所有统计数字用 `--mono` + `font-variant-numeric: tabular-nums` 对齐。

---

## 4. 共享外壳层 `site-chrome`（全站特效与底栏）

### 4.1 接入方式

每个前台页 `<head>` 内两行（已接入；新页照抄）：

```html
<link rel="stylesheet" href="assets/site-chrome.css">
<script defer src="assets/site-chrome.js"></script>
```

底栏挂载点：页面内放一个空 `<footer></footer>` 即可，JS 会自动规范化为统一底栏（见 4.7）。

### 4.2 背景动效 `#site-fx` `[已实现]`

JS `initFx()` 注入一个 `position:fixed; z-index:0` 的全屏层，内含：

- **2 个 aurora 辉光团**：`.a1`（磷光绿，34s 漂移）、`.a2`（琥珀，46s 漂移、更淡），`filter:blur(90px)`，仅动 `transform`（GPU 友好）。
- **10 个 ember 磷光粒子**：`initFx()` 循环生成，随机水平位置、9–21s 随机时长、负延迟错峰，从顶部缓慢下落（`@keyframes fall`），营造终端余烬感。
- `prefers-reduced-motion: reduce` 时，aurora 与 ember 动画全部停止。

### 4.3 主题光标 `[已实现]`

纯 CSS（内联 SVG data-URI），无 JS 跟随：

- **默认**：终端扫描准星（四向刻度 + 中心点 + 外环，带深色描边保证任意背景可见），hotspot 居中 `14 14`。
- **可点元素**（`a, button, [role=button], summary, label`）：`❯` 命令行提示符光标。
- **输入元素**（`input, textarea, [contenteditable]`）：保留文本 I-beam。

### 4.4 点击特效：随机字符掉落 `initGlyphs()` `[已实现]`

- 监听全局 `pointerdown`，在落点附近随机生成 **2–4** 个终端字符（取自 `01{}<>/[]$;:_*#=+-ABCDEFabcdef`）。
- 字符等宽磷光绿 + glow，沿 `@keyframes glyphfall` 下坠 88px 并淡出，时长 **1.9s**，落点带轻微抖动与字号/延迟随机；1s… 实际 2000ms 后移除节点。
- `prefers-reduced-motion` 下函数直接 return，不掉字符。

### 4.5 加载动画 `initLoad()` + 骨架屏 `[已实现]`

- **启动层** `#site-load`：全屏 `z-index:10000`，内容 `$ tzblog ❯ booting` + 闪烁方块光标 + 磷光绿扫描进度条；`window load` 后保证最短 520ms 展示再淡出移除。每次切页都会重放（各页独立加载脚本）。
- **内容骨架** `.skeleton` 工具类：`--panel-2` 底 + 磷光绿微光 shimmer 扫过，供异步内容占位直接套用。

### 4.6 报错提示 `initErr()` `[已实现]`

- 监听全局 `error` 与 `unhandledrejection`，弹出终端红错误条 `#site-err`（左红条 + ⚠ + 可点 ✕ 关闭，6s 自动收起）。
- 暴露 `window.siteChrome.error(msg)` 供页面主动调用（如接口请求失败时）。
- 消息以 `textContent` 注入（无 XSS 风险）；用冒泡监听，资源 404 不误报，只抓未捕获的 JS 异常。

> **后端对接提示**：前端请求失败时，统一调用 `window.siteChrome.error(err.message)` 呈现错误（迁移到 Next.js 后对应一个全局 toast / error boundary）。

### 4.7 统一底栏（单一数据源）`initFooter()` `[已实现]`

- 历史问题：8 个前台页曾出现 **7 种不同底栏 markup**（复制粘贴漂移）。现已根治。
- 机制：`site-chrome.js` 内常量 `FOOTER` 是**唯一**底栏 HTML 源；`initFooter()` 查找页面 `<footer>`、清空其 class、写入 `FOOTER`。改底栏只改这一处。
- 结构：`.sf-main`（品牌简介 + 社交 GitHub/X/RSS/Email）+ 三列（导航 / 分类 / 友情链接）+ `.sf-bottom`（版权 · ICP 备案号 · Powered by Next.js·Go·Vercel）。
- 社交/友链点击走 `[data-msg]` toast 提示（见 4.8），真实工程替换为实际外链 `href`。
- **opt-out**：`<body data-no-footer>` 时 `initFooter()` 直接跳过注入。**404 / 500 报错页用此标记**——报错页是聚焦恢复屏（顶栏 nav + 卡内 CTA 已够），不应挂营销底栏（订阅/友链/分类在错误页不合时宜）。迁移须保留此例外：错误页无底栏。

### 4.8 通用 toast `initToast()` `[已实现]`

任意元素加 `data-msg="文案"`，点击即弹出居中提示条（1.8s 自动消失）。原型里用于「登录后才能…」「已复制」等轻反馈。

---

## 5. 前台页面逐页说明

> 公共结构：每页顶部 `.topbar`（sticky + 毛玻璃，命令行风导航：home / search / pathways / works / shelf / about），主体 `.wrap`（z-index:1 盖在背景动效之上），底部统一底栏。

### 5.1 `front-home.html` — 首页 `[已实现交互]`

- **板块**：置顶大卡（精选文章）→ 文章流（最新/精选/AI Coding 三 tab）→ 五条内容线分类区。
- **侧栏 6 模块**（其余前台页范式）：关于作者 / 热门标签 / 本周学习路径 / 站点统计（文章数·总字数·建站天数·月访客·最近更新）/ 最新评论 / 友情链接。
- **效果**：卡片 hover 抬升、滚动 fade-up 入场、点击波纹（共享层）。
- **对应接口** `[建议]`：见 6.3 文章列表、6.4 置顶、6.7 评论、6.5 标签、6.10 站点统计。

### 5.2 `front-article-tutorial.html` — 文章详情页（阅读核心）`[已实现交互]`

- **板块**：标题/作者/元信息 → 正文（## 小节）→ 代码块（行号 + 语言标签 + 一键复制）→ 「核心洞察」callout → 上一篇/下一篇 → 评论区 → 右侧 TOC + 点赞/收藏/分享侧栏。
- **效果与实现**：
  - 顶部**阅读进度条** `#bar`：`scroll` 事件按 `scrollTop/(scrollHeight-clientHeight)` 计算宽度（`{passive:true}`）。
  - **TOC scroll-spy**：IntersectionObserver 高亮当前小节。
  - **代码复制** `[data-copy]`：`navigator.clipboard.writeText`，按钮变 `copied ✓`。
  - **分享** `[data-share]`：复制 `location.href` 到剪贴板。
  - 点赞/收藏/「发布评论」当前走 `data-msg` 提示（需登录）。
- **对应接口** `[建议]`：6.3 文章详情、6.7 评论 CRUD、6.8 点赞/收藏、6.6 上一篇/下一篇。

### 5.3 `front-search.html` — 全文搜索 `[已实现交互]`

- **板块**：命令行搜索框（`tzblog ❯` prompt + 闪烁光标，`#q`）+ 分类 chip 过滤（`.chip[data-cat]`：全部/AI Coding/全栈/工具/随笔）+ 终端式命中行（`> 命中 N 篇 · 0.02ms`）+ 结果列表。
- **实现**：内置 `POSTS` 数组；`render()` 按「关键词 ∩ 当前分类」过滤，关键词在结果里 `<mark>` 高亮；`aria-pressed` 标记激活 chip；`/` 聚焦、`Esc` 失焦。
- **对应接口** `[建议]`：6.9 搜索（Meilisearch 代理）。

### 5.4 `front-library.html` — 归档 + 书架 `[已实现交互]`

- **板块**：按年份时间线归档文章 + 书架（在读/读过的技术书单）+ 归档/书架 tab 切换。
- **对应接口** `[建议]`：6.3 文章列表（按 `year` 分组）、6.11 书架。

### 5.5 `front-works.html` — 作品集

- **板块**：项目卡片网格（仓库名/简介/技术栈标签/star/链接）。
- **对应接口** `[建议]`：6.12 作品/项目列表。

### 5.6 `front-pathways.html` — 学习路径 `[已实现交互]`

- **板块**：三条路径切换（AI Coding 上手 / 全栈工程 / 从 0 搭博客）+ 进度时间线（done/now/locked 三态 + 进度条）+ 每步挂真实文章（难度/时长）。
- **对应接口** `[建议]`：6.13 学习路径、6.8 用户进度。

### 5.7 `front-about.html` — 个人主页 / 关于

- **板块**：hero 自述 → 技能/技术栈 → 经历时间线 → 代表作 → 联系方式，配特效凸显个人能力。
- **对应接口** `[建议]`：6.14 站点 about/profile（多取自站点设置）。

### 5.8 `landing.html` — 营销落地页 `[已实现交互]`

- **板块**：Hero 双栏（主张 + 双 CTA + **自播终端**）→ 真实数据条 → 6 张特性卡 → 五条内容线 → 订阅 CTA。
- **签名模块（迁移须 1:1 复现）**：Hero 右侧**自播终端**——自动打字轮播三幕真实命令演示产品：`tz search "RSC 缓存"`（秒搜命中）→ `tz read spec-first`（读正文片段）→ `tz stats --all`（站点数据）。逐字打字 + 输出淡入 + 2.7s 停顿后切下一幕循环；`prefers-reduced-motion` 下退化为静态第二幕。这是 landing 的决定性时刻，勿降级回静态截图。
- **对应接口** `[建议]`：6.15 订阅（邮件 newsletter）；终端三幕内容可静态硬编码（营销演示），无需真实接口。

### 5.9 `account.html` — 个人中心（登录读者）`[已实现交互]`

- **板块**：身份卡（头像 / 昵称 / OAuth 来源 / 注册信息）→ **签到模块** → **阅读热力图** → 可点统计盒 ×4 → tab（收藏 / 点赞 / 评论 / 历史）+ 列表。
- **签名模块（迁移须 1:1 复现，这是本页的设计灵魂，勿降级成普通卡片）**：
  - **签到 `checkin --streak`**：磷光绿大号连续天数 + 本周一~日打卡条（已签 `✓` / 今日高亮环 / 待签 三态）+ 可点「签到」按钮（点击标记今日、天数 +1、toast）。对应 §6.8 `GET /me/streak`、`POST /me/checkin`。
  - **阅读热力图 `git log --reading`**：18 周 × 7 的 GitHub 贡献格，磷光绿 4 级透明度（`data-l="1..4"` → `rgba(63,224,143,{.22/.44/.68/.94})`），hover 放大 + 图例「少→多」。原型用确定性 hash 生成保证刷新稳定；真实数据取 §6.8 `GET /me/heatmap`。
- **交互**：4 个统计盒是 `<button>`，与下方 tab 经单一函数 `selectView(view)` 联动高亮——点统计盒即切对应 tab，避免数字与 tab 两套状态漂移。
- **身份一致性**：顶栏 prompt 为 `reader_42@tzblog:~/me`（登录读者，非站主 `haiden@`）。
- **对应接口** `[建议]`：§6.8 用户态（me 汇总 / 四 tab 列表 / 签到 / 热力图）。

---

## 6. 接口契约 `[建议]`（供后端实现 / 前端对接）

> 以下为**根据原型交互推导**的 RESTful 契约建议。基址示意 `https://api.tzcode.top/v1`。鉴权用 `Authorization: Bearer <jwt>`（匿名接口可省略）。

### 6.1 统一响应信封

所有接口返回同一信封（与项目既定 `ApiResponse<T>` 一致）：

```jsonc
{
  "success": true,
  "data": { /* 业务数据，失败时为 null */ },
  "error": null,          // 失败时为字符串错误信息
  "meta": {            // 分页类接口才有
    "total": 128,
    "page": 1,
    "limit": 20
  }
}
```

错误码约定（HTTP 状态 + `error` 文案）：`400` 参数错误 · `401` 未登录 · `403` 无权限 · `404` 不存在 · `409` 冲突（如 slug 重复）· `422` 校验失败 · `429` 频率限制 · `500` 服务端错误。

### 6.2 鉴权 `[建议]`（对应 `auth.html`）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/auth/oauth/github` | 跳转 GitHub OAuth（优先方式） |
| GET | `/auth/oauth/google` | 跳转 Google OAuth |
| POST | `/auth/register` | 邮箱注册 `{ email, password }` |
| POST | `/auth/login` | 邮箱登录 `{ email, password }` → `{ token, user }` |
| POST | `/auth/magic-link` | 发送 magic-link `{ email }` |
| GET | `/auth/magic-link/verify?token=` | 校验 magic-link → `{ token, user }` |
| POST | `/auth/logout` | 退出 |
| GET | `/auth/me` | 当前用户 `{ user }` |

`auth.html` 原型：tab 切换登录/注册，GitHub 按钮置顶，含邮箱表单 + magic-link 入口，提交走前端校验。**未做** 短信/社交（微信等）登录入口。

### 6.3 文章 Posts

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/posts` | 匿名 | 列表，query：`page`、`limit`、`category`、`tag`、`tab`(latest/featured/ai-coding)、`year` |
| GET | `/posts/{slug}` | 匿名 | 详情（含正文 HTML、TOC、上下篇引用） |
| POST | `/posts` | 管理员 | 新建（草稿/发布） |
| PUT | `/posts/{id}` | 管理员 | 更新 |
| DELETE | `/posts/{id}` | 管理员 | 删除 |

`Post` 模型见 7.1。详情返回建议附带 `toc`（`[{ id, text, level }]`）、`prev`/`next`（`{ slug, title }`）。

### 6.4 首页置顶配置 Pinned `[建议]`（对应 `admin-sections.html`）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/home/pinned` | 匿名 | 首页置顶文章（有序） |
| PUT | `/home/pinned` | 管理员 | 设置 `{ postIds: [".."] }`（有序） |

> 这是用户明确要的「首页置顶可在管理界面配置」。后台 `admin-sections.html` 提供置顶选择器，前台 `front-home.html` 顶部大卡读取此接口。

### 6.5 板块 / 分类 Sections & Categories `[建议]`（对应 `admin-sections.html`）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/categories` | 匿名 | 分类列表（含计数） |
| POST | `/categories` | 管理员 | 新建板块 `{ name, slug, description, order }` |
| PUT | `/categories/{id}` | 管理员 | 编辑 |
| DELETE | `/categories/{id}` | 管理员 | 删除（需处理存量文章归属） |

> 这是用户明确要的「新增板块的设置功能」。

### 6.6 标签 Tags / 6.5 计数

`GET /tags` → 热门标签 `[{ name, slug, count }]`（首页侧栏「热门标签」、搜索页 chip 数据源）。

### 6.7 评论 Comments `[建议]`

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/posts/{slug}/comments` | 匿名 | 评论列表（树形/分页） |
| POST | `/posts/{slug}/comments` | 注册 | 发表 `{ body, parentId? }` |
| DELETE | `/comments/{id}` | 作者本人/管理员 | 删除 |
| POST | `/admin/comments/{id}/approve` | 管理员 | 审核通过（后台待审队列） |

### 6.8 用户态：账户中心 / 点赞 / 收藏 / 进度 `[建议]`（对应 `account.html`）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/me` | 注册 | 个人资料 + 计数 `{ profile, counts:{ favorites, likes, comments, history } }`（驱动身份卡 + 4 个统计盒） |
| GET | `/me/{collections\|likes\|comments\|history}` | 注册 | account 四个 tab 的列表（分页 `?page=&limit=`） |
| POST/DELETE | `/posts/{id}/like` | 注册 | 点赞/取消 |
| POST/DELETE | `/posts/{id}/bookmark` | 注册 | 收藏/取消（进「我的书架」） |
| PUT | `/me/pathways/{id}/progress` | 注册 | 学习路径进度 `{ stepId, done }`（跨设备同步） |
| GET | `/me/streak` | 注册 | 签到态 `{ current, longest, thisWeek:[bool×7], checkedToday }`（驱动签到模块） |
| POST | `/me/checkin` | 注册 | 今日签到 → `{ current, checkedToday:true }`；**幂等**，重复签到不重复计数 |
| GET | `/me/heatmap?weeks=18` | 注册 | 阅读热力 `{ cells:[{ date, count, level:0..4 }] }`（驱动热力图，`level` 直接映射 `data-l`） |

### 6.9 搜索 Search `[建议]`（Meilisearch 代理）

`GET /search?q=&category=&page=&limit=` → `{ hits: [Post], processingTimeMs, estimatedTotalHits }`。前端命中行的「0.02ms」对应 `processingTimeMs`。建议命中字段高亮由后端返回 `_formatted`。

### 6.10 站点统计 Stats `[建议]`

`GET /stats/site` → `{ postCount, totalWords, sinceDays, monthlyVisitors, lastUpdated }`（首页侧栏「站点统计」）。

### 6.11–6.15 其余资源 `[建议]`

- `GET /shelf`（书架）→ `[{ title, author, status:reading|done, note }]`
- `GET /works`（作品）→ `[{ name, desc, stack:[], stars, repo, demo }]`
- `GET /pathways`（学习路径）→ `[{ id, title, steps:[{ id, postSlug, difficulty, minutes }] }]`
- `GET /about`（关于/个人资料，多源于站点设置）
- `POST /newsletter`（订阅）`{ email }`

### 6.16 媒体库 Media `[建议]`（对应 `admin-media.html`）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/admin/media` | 管理员 | 媒体列表（分页/筛选类型） |
| POST | `/admin/media` | 管理员 | 上传（multipart）→ `{ url, width, height, size }` |
| DELETE | `/admin/media/{id}` | 管理员 | 删除 |

### 6.17 站点设置 Settings `[建议]`（对应 `admin-settings.html`）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/admin/settings` | 管理员 | 读取分组设置 |
| PUT | `/admin/settings` | 管理员 | 保存 |

分组（原型表单）：站点身份（名称/描述/logo）· SEO（标题模板/关键词/OG）· 社交链接 · 评论开关 · ICP 备案号 · RSS · 分析（统计代码）。

---

## 7. 数据模型 `[建议]`

### 7.1 Post

```jsonc
{
  "id": "uuid",
  "slug": "spec-first-3000-lines",
  "title": "spec-first 让 Claude 连续写对 3000 行",
  "excerpt": "一句话摘要",
  "contentMarkdown": "原始 Markdown",
  "contentHtml": "Shiki/KaTeX 渲染后的 HTML",
  "category": "AI Coding",
  "tags": ["Claude", "工作流"],
  "cover": "https://.../cover.webp",
  "status": "published",   // draft | published
  "pinned": false,
  "readingMinutes": 8,
  "wordCount": 3200,
  "stats": { "views": 1247, "likes": 312, "bookmarks": 186, "comments": 12 },
  "publishedAt": "2026-05-20T10:00:00Z",
  "updatedAt": "2026-05-28T09:00:00Z"
}
```

### 7.2 其它

- **User**：`{ id, name, avatar, email, provider: github|google|email, role: user|admin, createdAt }`
- **Comment**：`{ id, postId, userId, author:{name,avatar}, body, parentId, status: pending|approved, createdAt }`
- **Category**：`{ id, name, slug, description, order, postCount }`
- **Pathway**：`{ id, title, description, steps:[{ id, postSlug, title, difficulty, minutes }] }`
- **Media**：`{ id, url, type: image|file, width, height, size, createdAt }`
- **Settings**：见 6.17 分组，建议存为 KV 或单行 JSON。

---

## 8. 后台页面逐页说明

> 公共结构：左侧**固定**导航（`app-shell`：外壳锁 `height:100vh; overflow:hidden`，侧栏与顶栏不滚动，仅主内容区滚动 —— 这是早期「侧栏跟随滚动」bug 的修复方案，新后台页务必沿用）。配色与前台同源但更克制：磷光绿只用于状态点/激活态/关键数字。
>
> **侧栏单一数据源**：6 个后台页的侧栏导航不再手写，统一由 `assets/admin-chrome.js` 运行时注入——页面只保留一个 `<aside class="side">`（或 editor 的 `<aside class="nav">`）占位元素，JS 用 `NAV` 数组渲染 canonical 菜单（含「板块与置顶」），并按当前文件名自动高亮。新增后台页只需放占位 `<aside>` + 在 `</head>` 前接入 `admin-chrome.{css,js}` 两行；改菜单只改 `NAV` 数组一处。

| 页面 | 板块 | 对应接口 |
|---|---|---|
| `admin-dashboard.html` | 4 张统计卡 + 最近文章表 + 14 天访客 sparkline + 待审评论队列（通过/删除 `[已实现交互]`） | 6.10、6.3、6.7（approve） |
| `admin-editor.html` | 双栏 Markdown 编辑 + 实时预览（轻量 MD 解析 `[已实现]`）+ 格式工具栏 + frontmatter 侧栏（状态/分类/标签/slug/摘要/封面）+ 字数·时长·存草稿/发布 | 6.3（POST/PUT）、6.16（封面上传） |
| `admin-sections.html` | 板块 CRUD + 首页置顶文章选择器 | 6.5、6.4 |
| `admin-analytics.html` | SVG 趋势曲线 + 流量来源 + 热门搜索词 + 分类分布 | 6.10（扩展统计） |
| `admin-media.html` | 媒体网格 + 上传 + 删除 | 6.16 |
| `admin-settings.html` | 分组设置表单（身份/SEO/社交/评论/ICP/RSS/分析） | 6.17 |

---

## 9. 前端对接指南（从 mock 切到真实接口）

1. **定位 mock**：每页内联 `<script>` 里的常量数组（如 `front-search.html` 的 `POSTS`、首页文章流、侧栏统计）即数据注入点。
2. **替换为 fetch**：在 Next.js 重构时，用 Server Component / `fetch` 拉取 §6 接口，按 §7 模型渲染。请求失败统一 `window.siteChrome.error(msg)`（或迁移后的全局 error boundary）。
3. **加载态**：异步区块用 `.skeleton`（§4.5）占位，数据到达后替换。
4. **鉴权门槛**：当前用 `data-msg` 提示「登录后才能…」的动作（点赞/收藏/评论/下载），接真接口后改为：未登录跳 `auth.html`/弹登录，已登录调对应接口（§6.8、§6.7）。
5. **保持单一数据源**：底栏、背景、光标、点击/加载/报错继续走 `site-chrome`，不要在页面里重复实现。

---

## 10. 已知限制 / 待办

- 原型为静态 mock，§6 接口尚未实现（后端任务）。
- 仅做了响应式断点的桌面/平板/移动主路径，超细分设备未逐一回归。
- `assets/tzblog-ui.{css,js}` 为遗留层，页面已迁离；真实工程可删除。
- 本会话无法跑浏览器实测，交互逻辑经静态核对，渲染请在浏览器中验收。
- 评论树形嵌套、富文本、@提及等高级能力原型未覆盖，按需在 §6.7 扩展。
