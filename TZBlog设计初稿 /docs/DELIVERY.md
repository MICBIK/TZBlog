# tzblog 前端交付总文档 · DELIVERY.md

> **这份文档是什么**：交付给另一个 AI / 工程师的**单一入口**。它不重复其它文档，而是 ① 编排阅读顺序，② 补上分散在各处、却没被任何文档完整记录的**共享层技术契约 / data 属性契约 / token 命名真相 / 交付硬伤清单**。
> **目标**：照此交付，另一个 AI 能完整复现前端实现细节，不踩坑。
> 维护者：设计/前端流程产出 · 最后更新 2026-06-14。

---

## 0. 阅读顺序（先读本文件，再按需展开）

| # | 文档 | 职责（唯一权威） |
|---|---|---|
| 0 | **DELIVERY.md**（本文件） | 总入口：文件地图 + 共享层契约 + data 契约 + token 真相 + 硬伤清单 |
| 1 | `DESIGN.md` | **视觉单一数据源**：色彩 / 字体 / 间距 / 动效 token，token 命名真相在 §8 |
| 2 | `frontend-handoff.md` | **逐页效果事实来源** + 接口契约（§6）+ 数据模型（§7） |
| 3 | `migration-spec.md` | 迁移到 Next.js 15 的构建规范 + 验收(DoD) + 库职责边界 |
| 4 | `production-readiness-checklist.md` | 上线缺口清单（P0/P1/P2） |
| 5 | `remaining-work.md` | 前端 vs 后端职责拆分 |
| — | `migration-progress.md` | 迁移 loop 的进度勾选表（loop AI 自己维护） |

冲突时优先级：视觉以 `DESIGN.md` 为准；逐页效果以 `frontend-handoff.md` 为准；本文件描述的是**跨页共享机制**，是上面两者都没细写的连接层。

---

## 1. 文件地图与加载关系

**静态原型，纯 HTML + CSS + JS，无构建步骤。** 21 个 HTML，共享层在 `assets/`。

```
前台 8     front-home / front-article-tutorial / front-search / front-works
           / front-library / front-pathways / front-about / landing
后台 6     admin-dashboard / admin-analytics / admin-editor / admin-media
           / admin-sections / admin-settings
入口/系统  index(launcher) / auth / account / 404 / 500 / archive

assets/
  site-chrome.css/.js   前台共享层（底栏/背景/光标/点击/加载/报错/焦点/跨页过渡）
  admin-chrome.css/.js  后台侧栏共享层（canonical 导航）
  tzblog-ui.css/.js     ⚠️ 遗留死代码，已无页面加载，勿在迁移中沿用
```

**每页 `<head>` 自带内联 `:root` + `<style>`（自包含），再 `<link>`/`<script defer>` 引共享层。** 关键加载契约：

| 页面组 | 引 site-chrome | 引 admin-chrome | 备注 |
|---|---|---|---|
| 前台 8 + auth + account + archive + 404 + 500 | ✅ css+js | — | 共 13 页（见硬伤 §6 的 auth/404/500 例外）|
| 后台 6 | — | ✅ css+js | 各页自带内联样式 + admin-chrome 注入侧栏 |
| `index.html` | ❌ 都不引 | — | 开发期 launcher，独立设计，`noindex` |

> `auth.html`：**只引 site-chrome.css、不引 .js**（要主题光标/焦点/过渡，但不要营销大底栏）。  
> `404/500`：引 css+js，但 `<body data-no-footer>` 跳过底栏注入（见 §3、§6）。

---

## 2. 共享层技术契约（本文件的核心补全）

### 2.1 `site-chrome.js` — 前台单一数据源（IIFE，`defer` 注入）

`init()` 顺序：`initLoad → initFx → initFooter → initGlyphs → initToast → initErr`。全部读 `matchMedia('(prefers-reduced-motion:reduce)')`（`reduce`）做降级。

| 函数 | 注入元素 | 行为 | 迁移要点 |
|---|---|---|---|
| `initLoad()` | `#site-load` | 终端启动遮罩（`$ tzblog ❯ booting` + 进度条），`window load` 后最短 520ms 淡出移除 | 每次切页都放一次；Next.js 里改成路由 loading 态 |
| `initFx()` | `#site-fx` | 2 个 `.aurora`(a1/a2) 漂移 + `reduce` 时跳过的 10 个 `.ember` 下落粒子 | 纯 transform/opacity |
| `initFooter()` | 接管 `<footer>` | **核心**：`querySelector('footer')` 抓页面任意 `<footer>`，清 class、写入常量 `FOOTER`；无 footer 则创建。`<body data-no-footer>` 时直接 return | 底栏 HTML 改 `FOOTER` 常量一处（§6 硬伤①）|
| `initGlyphs()` | `#site-fall` | 点击落点掉 2–4 个随机终端字符，1.9s 缓落淡出，2s 清理；`reduce` 时整体 return | 装饰，迁移可选 |
| `initToast()` | 动态 | 全局监听 `[data-msg]` 点击 → 居中 toast（1.8s）；`e.preventDefault()` | 见 §3 |
| `initErr()` | `#site-err` | 监听 `error` + `unhandledrejection` → 终端红错误条（6s，可点 `[data-errx]` 关）；暴露 `window.siteChrome.error(msg)` | 消息 `textContent` 注入，无 XSS |

**`FOOTER` 常量结构**（唯一底栏源）：`.sf-main`（`.sf-brand` 品牌+`.sf-soc` 社交 4 链 + 3×`.sf-col` 导航/账户/分类/友链）+ `.sf-bottom .in`（版权 · ICP备案 · Powered by）。社交/友链/备案是 `data-msg` 占位，生产换真实 `href`。

### 2.2 `site-chrome.css` — 前台共享样式

- **焦点**（全站 a11y）：`:focus-visible{outline:2px solid var(--acc,var(--accent,#3fe08f));outline-offset:2px}` —— WCAG 2.4.7/2.4.13。
- **跨页过渡**：`@view-transition{navigation:auto}` + `html{background:var(--bg)}` 防 MPA 白闪。
- **reduced-motion 块**：关 aurora/ember/skeleton/loadbar/光标，并 `::view-transition-*{animation:none}`（VT API 不自动遵守 RM，必须手动关）。
- **类**：`#site-fx .aurora/.ember`、`#site-load .box/.ln/.cur/.bar i`、`#site-err .ic/.x`、`#site-fall span`、`.skeleton`(+`::after` shimmer 骨架屏工具类)、`.sf-*` 底栏全套、`.topbar .wrap.wrap{max-width:1480px}`(顶栏宽度覆盖，双类提特异性)。

### 2.3 `admin-chrome.{css,js}` — 后台侧栏单一数据源

- **JS**：常量 `NAV`（概览/内容/系统三组）是**唯一**菜单源。`init()` 用 `querySelector('aside.side,aside.nav,aside.ac-side')` 抓任意旧侧栏 → 加 `.ac-side` 类 → `build(cur)` 重写为 canonical 导航 → 按 `location.pathname` 文件名高亮当前项 → 注入移动端 `#ac-burger` 抽屉开关。改菜单只改 `NAV` 一处，6 页同步。
- **CSS**：`.ac-side`/`.ac-brand`/`.ac-grp`/`.ac-it`(`.on` 激活态带磷光左竖条)/`.ac-ic`/`.ac-me`；`:focus-visible` 同款焦点环；`@media(min-width:881px){body{grid-template-columns:232px 1fr}}` 规整列宽；`@media(max-width:880px)` 抽屉。

---

## 3. data 属性契约（全站，迁移须保留语义）

| 属性 | 出现位置 | 含义 / 行为 |
|---|---|---|
| `data-site-footer` | 底栏挂载点（JS 运行时也会补） | 标记 canonical 底栏；JS 实际靠 `querySelector('footer')` 接管，不依赖此属性 |
| `data-no-footer` | `<body>`（404/500） | 让 `initFooter()` 跳过注入——报错页不挂营销底栏 |
| `data-msg="文案"` | 底栏社交/友链、各页占位动作 | 点击弹 toast；生产替换为真实链接/行为 |
| `data-errx` | 错误条关闭按钮 | 点击关闭 `#site-err` |
| `data-cat` | front-search | 分类 chip 过滤值 |
| `data-by` | archive | 归档分组维度（年份等） |
| `data-f` | front-works / admin-media | 技术栈 / 媒体类型过滤值 |
| `data-v` | front-library / account 的 tab | tab 切换目标 view id（`.view.on`） |
| `data-copy` `data-code` | 文章页代码块 | 一键复制：`data-code` 存源码，点 `data-copy` 复制 |
| `data-share` | 文章页 | 复制当前链接到剪贴板 |
| `data-md` | admin-editor | Markdown 源 → 实时预览 |

每个交互页的 JS 都内联在该页 `<script>` 里（tab 切换、实时检索、过滤、复制、Markdown 预览等）；逐页交互清单见 `frontend-handoff.md §5/§8`。

---

## 4. token 三套命名真相 + fallback 链（最容易翻车，务必读）

canonical 磷光绿 = **`#3fe08f`**（`DESIGN.md` 已锁定，全站 grep 零漂移）。但**同一角色有三套 token 名**，是迁移前未统一的历史遗留（`DESIGN.md §8.3` 记录、故意推迟到迁移期归一）：

| token 名 | 用在 | 暗色变体 |
|---|---|---|
| `--acc` / `--acc-dim` | 前台内容页（home/article/search/about/archive/auth/account/404/500） | `--acc-dim:#1f7a4d` |
| `--accent` / `--accent-dim` | 全部后台 + index + landing | `--accent-dim:#1f7a4d` |
| `--green` / `--green-dim` | front-works / front-library / front-pathways / admin-editor | `--green-dim:#1f7a4d` |

**所以共享层所有引用都写 fallback 链兜底**，例如焦点环 `var(--acc,var(--accent,#3fe08f))`、admin 用 `var(--accent,var(--acc,#3fe08f))`——三种命名都解析到同一个 `#3fe08f`。**迁移到 Tailwind `@theme` 时归一为单一语义名（如 `--color-accent`），这是 `migration-spec §3` 的任务，别在静态原型里逐个改数百处引用。**

中性梯度也有三套（前台 `--bg:#0b0f14` vs 后台/works `#0a0e14`，命名 `--dim` vs `--faint`）——同属 §8.3 推迟项，迁移时统一。

---

## 5. 动效契约（全站，已文档化于 `DESIGN.md §5`）

- **跨页**：`@view-transition` 淡入（site-chrome.css），RM 下 `::view-transition-*{animation:none}` 静切。
- **章节滚动入场**：`.rv → .rv.in`（opacity 0→1 + `translateY(16px)`，`.5s cubic-bezier(.16,1,.3,1)`，IntersectionObserver 触发一次）。**按页型分治**：仅长叙事页（home/article/about）有；功能/列表页（search/works/library/pathways）**不加**——有意原则。
- **微交互**：hover/active 走各页内联 `transition`（≤.18s）。
- **键盘焦点**：§2.2 的 `:focus-visible` 磷光绿环，全站。
- **reduced-motion**：共享层 + 各内容页 + 4 个功能页均有守卫，全站闭环。所有动画仅 `transform`/`opacity`，无 layout 属性动画。

---

## 6. 交付硬伤清单（漏了就翻车）

1. **底栏靠 JS 接管，不是靠属性**：`initFooter()` 用 `querySelector('footer')` 抓页面任意 `<footer>` 覆盖成 canonical。迁移到组件化时，底栏要做成共享组件单一源，别让各页再手写 footer（历史上曾漂移成 7 种格式）。
2. **报错页无底栏是有意的**：404/500 用 `<body data-no-footer>`，迁移须保留——错误页是恢复屏，不挂营销底栏。
3. **`auth.html` 只引 css 不引 js**：要焦点/光标/过渡但刻意无大底栏（登录页惯例）。迁移别盲目给它加底栏。
4. **`index.html` 是开发期 launcher**：独立设计、`noindex`、不属于博客本体，不要把它的动效/样式当博客页处理。
5. **`tzblog-ui.css/.js`（66KB+11KB）是死代码**：所有页面已迁离、不加载。迁移时**不要**参考或移植它，以它为准会引入旧主题污染。
6. **token 三套命名**：见 §4。读到 `--acc`/`--accent`/`--green` 要知道它们是同一个绿；迁移归一为单一名。
7. **后台侧栏靠 `admin-chrome.js` 注入**：6 页的 `<aside>` 在运行时被 `NAV` 重写。改菜单改 `NAV`，别改各页 HTML（曾因手写副本导致「板块与置顶」只在 2 页出现）。
8. **接口全是 mock**：原型无后端。`frontend-handoff.md §6` 是**建议**契约（标 `[建议]`），原型里真跑的交互标 `[已实现]`。后端照 §6/§7 建接口与表。
9. **SEO**：9 个公开内容页有 description/canonical/OG/JSON-LD；11 个非索引页（6 后台 + auth/account/index/404/500）有 `noindex`，迁移保留。

---

## 7. 验收口径

- 视觉：全站单绿 `#3fe08f`、底栏统一、后台侧栏一致、`--dim` 文本 ≥4.5:1。
- 可访问：Tab 全站可见磷光绿焦点环；`prefers-reduced-motion` 下动效全关、平滑滚动变即时。
- 完整：13 前台页底栏一致（404/500 除外）、6 后台页侧栏含「板块与置顶」并高亮当前页、空/错误态齐全。
- 迁移完成：`migration-spec §7` 的 DoD 全绿 + 21 页迁完 + Markdown 真实管线（CodeMirror + remark/Shiki/KaTeX）+ 共享层组件化无副本，之后按 §9 产出 `backend-handoff.md`。
