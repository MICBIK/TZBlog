# tzblog 前端迁移构建规范 + 验收契约（Loop 模式总纲）

> 本文件是 **Loop 模式 AI 的唯一工作总纲**。目标：把当前静态 HTML 原型完整重写为
> **Next.js 15 (App Router + RSC) + TypeScript + Tailwind CSS v4 + shadcn/ui + Aceternity UI + Magic UI + framer-motion**，
> 并在每一轮自检「是否达成验收」，直到全部页面与效果迁移完成。
>
> 关联文档（**引用，不重复**）：
> - `docs/frontend-handoff.md` — 原型逐页板块/效果/交互的事实来源（迁移时对照它复现）
> - `docs/production-readiness-checklist.md` — 上线缺口 P0/P1/P2
> - `docs/remaining-work.md` — 剩余前端 + 后端工作拆分
>
> 原型是**静态 mock、无后端**。本规范只覆盖**前端**；接口部分一律按「契约（建议）」对待，用 mock/fixture 实现，真实后端由 §9 模板交付。

---

## 1. 目标技术栈与库职责边界（不要越界混用）

| 层 | 选型 | 只负责 |
|---|---|---|
| 框架 | Next.js 15 App Router + RSC | 路由、Server Components 取数、SSG/ISR |
| 语言 | TypeScript strict | 全量类型，无 `any` 兜底 |
| 样式 | Tailwind CSS v4（`@theme` 内联 token） | 所有布局/间距/颜色，禁手写散落 hex |
| 业务 UI | shadcn/ui + Radix | 按钮/表单/对话框/下拉/表格/标签页等**功能组件** |
| 营销特效 UI | Aceternity UI + Magic UI | landing/about 的 hero、光效、入场等**展示型**段落 |
| 动效 | framer-motion | 页面/组件级 motion、列表 stagger、布局动画 |
| 包管理 | pnpm | 唯一 |

边界铁律：业务后台**只用 shadcn**（克制、密度优先）；Aceternity/Magic **只用于前台营销面**（landing/about/home hero），**禁止**进入 dashboard/editor 等后台。framer-motion 做动效，不要用它重造 shadcn 已有的交互组件。

---

## 2. 项目结构（App Router）

```
app/
├── (site)/        # 前台分组，套 SiteChrome
│   ├── page.tsx # 首页  ← front-home.html
│   ├── about/page.tsx  # ← front-about.html
│   ├── search/page.tsx# ← front-search.html（客户端实时检索）
│   ├── posts/[slug]/page.tsx  # ← front-article-tutorial.html（RSC 渲染 MD）
│   ├── archive/page.tsx    # ← archive.html（tag/category/year 三合一，?type=&value=）
│   ├── library/page.tsx    # ← front-library.html
│   ├── works/page.tsx      # ← front-works.html
│   ├── pathways/page.tsx   # ← front-pathways.html
│   ├── account/page.tsx    # ← account.html（登录态 mock）
│   └── layout.tsx   # SiteChrome：顶栏 + 背景特效 + 底栏 + 光标/点击/loader/error
├── (marketing)/landing/page.tsx  # ← landing.html（Aceternity/Magic 重灾区）
├── admin/             # 后台分组，套 AdminChrome
│   ├── layout.tsx          # AdminChrome：canonical 侧栏（单一数据源）
│   ├── page.tsx            # dashboard
│   ├── editor/page.tsx     # CodeMirror + 实时预览
│   ├── analytics/page.tsx  ├── media/page.tsx
│   ├── sections/page.tsx   └── settings/page.tsx
├── (auth)/login/page.tsx   # ← auth.html（GitHub 优先 + Google + 邮箱 + magic-link）
├── not-found.tsx         # ← 404.html
├── error.tsx        # ← 500.html（'use client' + reset()）
└── globals.css   # @theme token + 共享特效 CSS
components/
├── ui/            # shadcn 生成
├── site/            # SiteFooter, TerminalBg, ThemedCursor, GlyphDrop, BootLoader, ErrorToast, TopNav
├── admin/         # AdminSidebar（NAV 数组单一数据源）
├── marketing/        # Aceternity/Magic 封装
└── post/       # MarkdownRenderer, Toc, ReadingProgress, CodeBlock, CommentThread
lib/  (data.ts mock fixtures, types.ts, api.ts 契约封装)
content/posts/*.mdx         # 文章源（迁移原型里写死的正文）
```

---

## 3. 设计系统迁移（暗色单主题，不要引入亮色）

把原型 `:root` token 原样搬进 `globals.css` 的 `@theme`：

```css
@theme {
  --color-bg:#0b0f14; --color-panel:#11171f; --color-panel-2:#141b24;
  --color-line:#1f2730; --color-line-2:#2a343f;
  --color-fg:#c9d4df; --color-fg-strong:#eef3f8; --color-muted:#6b7a89; --color-dim:#48555f;
  --color-acc:#3fe08f; --color-acc-dim:#1f7a4d; --color-amber:#e3b341;
  --font-mono:'JetBrains Mono',ui-monospace,monospace;
  --font-sans:'Noto Sans SC',system-ui,sans-serif;
--radius:6px;
}
```

铁律：磷光绿 `--acc` 是**唯一彩色 accent，每屏最多两处**；等宽体用于代码/数字/eyebrow，Noto Sans 用于正文；近黑画布，**不许**回退到米黄/纯白。对比度需过 WCAG AA（绿 on 近黑已达标，校验小字 `--dim`）。

---

## 4. 共享效果复现配方（原型 → 新栈，必须 1:1 还原观感）

全部封装进 `(site)/layout.tsx` 的 `<SiteChrome>`，对应原型 `assets/site-chrome.*` 这一**单一数据源**：

| 原型效果 | 新栈复现 |
|---|---|
| 终端扫描背景（scanline+grid+dot+aurora 漂移+ember） | `components/site/TerminalBg.tsx`，CSS 动画为主（`transform/opacity`），`fixed inset-0 -z-10 pointer-events-none`；`prefers-reduced-motion` 关闭 |
| 主题磷光绿箭头光标 + 可点态 ❯ | 全局 `cursor:url(svg)`，可点元素覆盖；输入框保留 I-beam |
| 点击随机字母掉落（1.9s 缓落） | `GlyphDrop.tsx`，`pointerdown` 监听，reduced-motion 时 no-op |
| 启动加载条 `$ tzblog ❯ booting` | `BootLoader.tsx`，最短 520ms；页面级用 `loading.tsx` + `.skeleton` 骨架 |
| 全局报错终端红条 | `error.tsx`（路由级） + `ErrorToast`（运行时 `error`/`unhandledrejection`），`textContent` 防 XSS |
| 跨页淡入（`@view-transition`） | App Router 默认软导航无白闪；保留 `@view-transition{navigation:auto}` 增强 |
| 统一底栏（单一数据源） | `SiteFooter.tsx`，唯一定义，禁各页另写 |
| 后台 canonical 侧栏 + 按路由高亮 + 含「板块与置顶」 | `AdminSidebar.tsx`，`NAV` 数组单一数据源，`usePathname()` 高亮 |

复现要点：原型里那些手写 rAF/IntersectionObserver 交互（阅读进度、TOC scroll-spy、search 实时过滤、pathways 进度、library 切换）迁移成 React hooks（`useScroll`/`useInView` 或原生 IO），**行为对齐原型**，不要降级。

---

## 5. 数据契约（mock 优先，接口标「建议」）

- `lib/data.ts` 提供 fixtures：`POSTS / CATEGORIES / TAGS / PATHWAYS / COMMENTS / SITE_STATS`，从原型写死内容迁移。
- `lib/api.ts` 用统一信封 `{ success, data?, error?, meta? }` 封装，**当前指向 mock**，预留真实 endpoint 注释（见 `frontend-handoff.md §6`）。
- RSC 页面从 `lib/data.ts` 取数（`async` Server Component）；客户端交互（search/like/comment）走乐观更新 mock。
- 真实接口/DB/搜索/鉴权回调/上传一律**不做**，进 §9 后端交付文档。

---

## 6. 前端工作范围（必须完成 = DoD 覆盖项）

**做**：20 个原型页 → 路由迁移；4 个共享特效层组件化；shadcn 表单/对话框/表格替换原型手写控件；Markdown 渲染管线（**CodeMirror 6 编辑 + remark/rehype + Shiki + KaTeX 预览/发布同管线**，禁沿用原型正则 mock）；空状态/骨架/分页/评论嵌套 UI；每页 `<head>` SEO（title/meta/OG/JSON-LD/canonical）；a11y（skip-link/focus-visible/aria/键盘）；响应式逐页核对；reduced-motion。

**不做（→ §9 后端文档）**：真实 API/DB/持久化、OAuth 回调/session/JWT/CSRF、Meilisearch、图片上传存储、CSP/安全头、rate limiting、CI/CD、监控、真实 analytics。

---

## 7. 验收要求 / Definition of Done（Loop 每轮对照，全绿才算完成）

**工程门禁（客观、可自检）**
- [ ] `pnpm tsc --noEmit` 零错误（strict）
- [ ] `pnpm lint` 零错误
- [ ] `pnpm build` 成功（无 RSC/`'use client'` 边界报错）
- [ ] `pnpm dlx @axe-core/cli` 或 Lighthouse a11y ≥ 95
- [ ] Lighthouse Perf ≥ 90 / SEO = 100（landing/home/article）

**页面级（每个路由都要过）**
- [ ] 与原型对应页**视觉观感一致**（暗色终端风、token、间距、accent 预算）
- [ ] 交互行为 = 原型（进度条/TOC/检索/复制/分享/路径/切换/CRUD/置顶）
- [ ] 响应式无横向滚动 @360/390/768/1024/1440/1920
- [ ] 空态/加载骨架/错误态齐备
- [ ] SEO 标记 + 语义 HTML + 键盘可达

**全局**
- [ ] 共享特效 4 件（背景/光标/掉字/loader+error）全站生效且为单一数据源
- [ ] 底栏、后台侧栏唯一定义，无副本漂移
- [ ] 暗色单主题、reduced-motion 全覆盖

**完成判定**：上述全绿 + 20 页全部迁移 + Markdown 管线真实可用 → 宣告前端完成，产出 §9 文档。

---

## 8. Loop 模式工作法（断点续作、防漂移）

1. 维护 `docs/migration-progress.md` 勾选表（页 × DoD），每轮先读它定位未完项。
2. **每轮一个完整可验收单元**（一个路由或一个共享组件），收尾必跑 §7 工程门禁。
3. 共享层（token/特效/底栏/侧栏）**先建**，页面复用，禁止逐页复制——这是原型踩过的坑。
4. 卡住超过两次同类报错：停下换思路，不要在 sleep 循环里重试。
5. 不臆造接口；mock 不够时在 `lib/data.ts` 补 fixture 并标注。

---

## 9. 前端完成后 → 后端交付文档模板（前端产出，交后端）

完成后新建 `docs/backend-handoff.md`，至少包含：
1. **接口清单**：从 `lib/api.ts` 的契约逐条列出 `METHOD /path`、入参、`{success,data,error,meta}` 响应、错误码。
2. **数据模型**：`lib/types.ts` 的 TS 类型 → 表结构建议（Post/User/Comment/Category/Pathway/Media/Settings，含索引、外键、软删除）。
3. **鉴权**：GitHub(优先)/Google OAuth + 邮箱 + magic-link；session/JWT 策略、CSRF、分级权限（匿名读 / 注册互动 / 管理员）。
4. **搜索**：Meilisearch 索引字段、同步时机、查询契约（对齐前端 search 入参）。
5. **内容管线**：MDX 存储位置、Shiki/KaTeX 在何处渲染（build vs runtime）、图片上传与 CDN。
6. **前端期望的契约边界**：哪些是乐观更新、哪些需强一致、分页参数、rate limit 期望。
7. **环境/安全**：CSP 白名单（来自前端实际外链）、安全头、所需环境变量清单。

---

**一句话给 Loop AI**：先搭 token + 4 个共享特效组件 + 两套 chrome layout，再逐路由迁移并对照 `frontend-handoff.md` 复现观感，每轮跑满 §7 门禁，全绿即停，最后按 §9 产出后端文档。
