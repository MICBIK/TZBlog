# Incomplete Pages Inventory — TZBlog

> 全部前台 + 后台路由完成度评级 + 本轮处理决定 + 后续归属。
> 截止 2026-05-23。
> 本文是 `public-ui-and-editor-overhaul` 交付物之一；执行方在 implementation 阶段把本表逐项落实。

---

## 0. 评级标准

- `done` — 功能 + UI 都过得去，本轮**只做 design-overhaul 涉及的视觉重做**，不补功能
- `polish-required` — 功能 OK，但视觉 / 信息密度 / 可读性不达标，本轮**必须**重做
- `partial` — 功能或 UI 有明显缺口（如缺空状态 / 缺 filter / 缺 error UI），本轮**部分**修复（具体见行注）
- `placeholder` — 占位文案 / 无 onClick / 仅 demo，**不允许**残留在导航
- `missing` — 路由在导航中暴露但页面文件不存在，**404 死链**，必须解决
- `dev-only` — 开发用，不应出现在公开导航

每条路由的"处理决定"在 `本轮 / V2 / V3 / 删除 / 不动` 五选一。

---

## 1. 前台路由清单

| 路由 | 文件 | 评级 | 当前状态 | 本轮处理 |
|---|---|---|---|---|
| `/` | `src/app/(site)/page.tsx` | polish-required | 7 段结构存在（Hero/LaunchNarrative/TechStack/GithubCard/Recent/Stats），但 Hero 叙事弱、Recent 仅 3 篇、Stats 行干瘪、缺 columns 入口、缺 principles 段 | **本轮重做**（home-redesign spec） |
| `/about` | `src/app/(site)/about/page.tsx` | polish-required | 5 段（AboutHero/Now/Story/Principles/Contact），内容散文化但维度不全（缺技术选型、实现思路、未来方向）；视觉与首页系统不够统一 | **本轮重做**（about-redesign spec） |
| `/posts` | `src/app/(site)/posts/page.tsx` | partial | 列表 + 分页 + cover 渲染 OK，**但**无 filter UI（仅 URL 参数）、无搜索框、空状态文案 placeholder | **本轮部分**：本 capability 不在 spec 列出，但若实施 home/about 时影响通用 PostCard / PostList 视觉，要同步 |
| `/posts/[slug]` | `src/app/(site)/posts/[slug]/page.tsx` | polish-required | 详情页结构 OK（cover hero / 内容 / TOC / 评论 / 点赞），**但** markdown 渲染需要本轮 markdown-reading 重做生效 | **本轮重做**（markdown-reading 影响）|
| `/columns` | `src/app/(site)/columns/page.tsx` | done | 网格展示完整，无明显缺口 | 不动（除非 home-redesign 影响 ColumnCard 视觉，同步） |
| `/columns/[slug]` | `src/app/(site)/columns/[slug]/page.tsx` | done | 专栏详情含文章列表，完整 | 不动 |
| `/tags` | `src/app/(site)/tags/page.tsx` | done | tags 索引，单语完整 | 不动 |
| `/tags/[slug]` | `src/app/(site)/tags/[slug]/page.tsx` | done | 单 tag 文章列表 + 分页 | 不动 |
| `/login` | `src/app/(admin)/login/page.tsx` | done | 邮箱密码 + 验证 toast | 不动（视觉与 admin 一致即可） |

### 1.1 前台导航完整性

`src/components/site/SiteHeader.tsx` 导航 link：

- ✅ `/posts` → 存在
- ✅ `/columns` → 存在
- ✅ `/about` → 存在
- ❌ 缺 `/tags` 入口（但实际有 page；当前没在 Header 列；判定：保持现状，不强加。`/tags` 作为 SEO + 内部链接入口足够）

### 1.2 前台缺失路由 / 入口决策

- **不缺**导航死链
- 本轮**新增**的入口（如有）须在 home-redesign 中明确

---

## 2. 后台路由清单

| 路由 | 文件 | 评级 | 当前状态 | 本轮处理 |
|---|---|---|---|---|
| `/admin` | `src/app/(admin)/admin/page.tsx` | polish-required | dashboard 含 metric / chart / top list / distribution；Light mode 整体可读性不达标（sidebar 4.6:1，无 active state） | **本轮重做 layout / sidebar / active state**；dashboard 内容不动 |
| `/admin/posts` | `src/app/(admin)/admin/posts/page.tsx` | polish-required | 列表 + filter + pagination + bulk OK，但缺 reset 按钮、缺 sort hint、表格对比度同上 | **本轮部分**：filter reset + 表格 zebra/hover 跟 admin-readability 一起 |
| `/admin/posts/new` | `src/app/(admin)/admin/posts/new/page.tsx` | polish-required | 编辑器页存在，但编辑器**严重偏离契约**（见 editor-source-contract / editor-preview-parity） | **本轮重做** |
| `/admin/posts/[id]/edit` | `src/app/(admin)/admin/posts/[id]/edit/page.tsx` | polish-required | 同上 | **本轮重做** |
| `/admin/columns` | `src/app/(admin)/admin/columns/page.tsx` | done | CRUD + reorder + dialog 完整 | **本轮微调**：表格视觉（admin-readability spec 影响） |
| `/admin/comments` | `src/app/(admin)/admin/comments/page.tsx` | polish-required | 4 tab + bulk + AlertDialog；行高紧、Badge 用 hardcoded color class（amber-100 等），与 token 系统不统一 | **本轮重做** Badge 走 token + 行高调整 + active tab 视觉 |
| `/admin/media` | `src/app/(admin)/admin/media/page.tsx` | done | dropzone + grid + pagination | **本轮微调**：表格视觉一致 |
| `/admin/_editor-demo` | `src/app/(admin)/admin/_editor-demo/page.tsx` | dev-only | 仅供编辑器 smoke test | **本轮不删除**（用于 EC PoC），但**不暴露**在 sidebar 导航（当前也未在 NAV_ITEMS） |
| `/admin/analytics` | **不存在** | missing | sidebar NAV_ITEMS 第 14 行有 link，但无 page.tsx → 404 | **本轮删除 sidebar link**；analytics 内容已在 `/admin` dashboard |
| `/admin/settings` | **不存在** | missing | sidebar NAV_ITEMS 第 15 行有 link，但无 page.tsx → 404 | **本轮删除 sidebar link**；归 V2 backlog（主题 GUI） |

### 2.1 后台导航完整性

`src/app/(admin)/admin/layout.tsx:8-16` 当前 NAV_ITEMS：

```ts
const NAV_ITEMS = [
  { href: "/admin", label: "概览" },           // ✅
  { href: "/admin/posts", label: "文章" },     // ✅
  { href: "/admin/columns", label: "专栏" },   // ✅
  { href: "/admin/comments", label: "评论" },  // ✅
  { href: "/admin/media", label: "媒体" },     // ✅
  { href: "/admin/analytics", label: "分析" }, // ❌ 缺页面
  { href: "/admin/settings", label: "设置" },  // ❌ 缺页面
];
```

**本轮处理**：

```ts
const NAV_ITEMS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/posts", label: "文章" },
  { href: "/admin/columns", label: "专栏" },
  { href: "/admin/comments", label: "评论" },
  { href: "/admin/media", label: "媒体" },
];
```

理由：

- `/admin/analytics`：dashboard 在 `/admin` 已完整。Sidebar 加 "分析" 跳 `/admin` 是重复入口；删除避免误导。如果用户希望"分析"作为独立 link 强化分类感，可在 admin-readability spec 决策（备选）：把 `/admin` label 改成 `Dashboard`、新增独立 link `/admin/analytics` 指向同 `/admin`（不推荐，因为 URL 重复）。
- `/admin/settings`：完全未实现。归 V2 backlog（主题 GUI / 站点配置 / 用户密码修改）。删除 link 让导航诚实反映现状。

### 2.2 后台 API 路由

API endpoint **不出现在导航中**，仅供前端调用。本轮**不动**：

- `/api/admin/{posts,columns,comments,media,tags,uploads}` 全部 OK
- `/api/posts/[slug]/{comments,like,view}` 全部 OK
- `/api/track`, `/api/auth/[...nextauth]`, `/rss.xml` 全部 OK

如果未来引入 `/api/admin/preview`（spec EP-D2 备选方案）才会新增一条。

---

## 3. 缺口分类汇总（按本轮处理决定）

### 3.1 本轮必须修复

| 项 | 文件 | 改动类型 |
|---|---|---|
| sidebar 删除 `/admin/analytics` link | `src/app/(admin)/admin/layout.tsx:14` | 删除 NAV_ITEMS 行 |
| sidebar 删除 `/admin/settings` link | `src/app/(admin)/admin/layout.tsx:15` | 删除 NAV_ITEMS 行 |
| sidebar active state 添加 | `src/app/(admin)/admin/layout.tsx:34-43` | 改组件（用 `usePathname`）|
| sidebar 改成独立组件 `AdminSidebar` | 新建 `src/components/admin/AdminSidebar.tsx`（项目里**已**存在 `AdminSidebar.tsx` 但未被 layout 引用，本轮接通它） | refactor |
| muted-fg 对比度调亮 | `src/app/globals.css` 多处 | token 调整 |
| Comments Badge 颜色改 token | `src/components/admin/comments/CommentsTable.tsx` | token-driven |
| 详情页 markdown 渲染换新管道 | `src/lib/markdown.ts` + `src/app/globals.css` | spec MR-* |
| 编辑器替换 source editor | `src/components/editor/*` | spec EC-* |
| 编辑器预览换完整管道 | 同上 | spec EP-* |
| 首页 7 段重组 | `src/app/(site)/page.tsx` + `src/components/site/Home*.tsx` | spec H-* |
| About 8 段重组 | `src/app/(site)/about/page.tsx` + `src/components/site/about/*.tsx` | spec A-* |

### 3.2 V2 backlog（已决定，不在本轮）

| 项 | 路由/feature | 关联 |
|---|---|---|
| `/admin/settings`（站点配置 + 主题 GUI） | missing | memory-bank V2 backlog 已有；本轮删除导航 |
| 详细 Analytics（来源/设备/国家/对比/导出） | `/admin/analytics` 独立页 | 当前 `/admin` 已基础；V2 拓展 |
| 编辑器增强（表格 wizard / 脚注 / 数学 / 拖拽图片） | `/admin/posts/*` 增强 | 本轮先把源码契约修好 |
| 评论邮件通知 | 跨模块 | V2 |
| 文章标签云 / 热门文章 widget | `/`、`/posts` | V2 |
| 详情页"阅读时间"/"阅读进度 bar" | `/posts/[slug]` | V2 |

### 3.3 V3 backlog（多语言）

- 所有 i18n 改造，见 `i18n-current-state.md §12`

### 3.4 不动 / 不在本轮范围

| 项 | 理由 |
|---|---|
| 替换 Auth.js | 当前满足 |
| 接 Giscus / 三方评论 | 自研评论已 OK |
| Playwright E2E | 技术债，独立 SDD |
| Lighthouse 95+ 调优 | 上线后实测再说 |
| 替换 Prisma / Next.js / Tailwind | 不动 |
| Dockerfile / VPS 部署（P3） | 与本轮 polish 解耦 |
| `_editor-demo` 路由本身 | 保留作为 spec EC-* 的 PoC 沙箱 |

---

## 4. 浏览器审查最小覆盖

按 ha1den 验收要求，本轮浏览器审查至少要审：

1. `/`（首页 light + dark）
2. `/about`（light + dark）
3. `/posts`（light + dark + 空状态 + 分页边界）
4. `/posts/[slug]`（含真实 markdown content：alerts、code block、table、list、blockquote 全用上）
5. `/admin`（light + dark + 已登录）
6. `/admin/posts`（light + dark + 含 1 篇文章 + 空状态）
7. `/admin/posts/new`（编辑器双栏；输入 markdown 全套语法验证 source/preview 一致性）
8. `/admin/posts/[id]/edit`（同上 + 加载已有内容时 round-trip）
9. `/admin/comments`（4 个 tab 切换 + 行内动作 + bulk）
10. `/admin/columns`（dialog + reorder）
11. `/admin/media`（dropzone + 网格）
12. `/login`（提交错误时 toast）

每个路由按 `browser-audit-checklist.md` 5 维度审查。

---

## 5. 死链与误导检测

执行方在归档前必须确认以下**不**残留：

- [ ] sidebar 不再出现 `/admin/analytics`、`/admin/settings`
- [ ] 任何 server / client error fallback 不再硬编码英文（与 i18n-current-state §15 一致化要求一致）
- [ ] 任何 page 不再有 `placeholder` / `TODO` / `lorem ipsum` 文案（grep 检查）
- [ ] 任何 client component 不再有 `console.log` 残留
- [ ] 任何 button 不再有 onClick 空实现或 "敬请期待" 类 toast
- [ ] About / README 含 "中文单语言" 明确声明（i18n-current-state §15）

---

## 6. 后续动作清单（交付方填）

| 路由 | 改动 commit | 完成日 | 备注 |
|---|---|---|---|
| `/admin/layout.tsx`（删 settings + analytics link） | TBD | TBD | spec AR-1 |
| `AdminSidebar` 接通 + active state | TBD | TBD | spec AR-2 |
| token 对比度调整 | TBD | TBD | spec AR-3 |
| comments Badge 改 token | TBD | TBD | spec AR-5 |
| ...其他根据 tasks.md | | | |

> 本表在 implementation 阶段持续填充；最终在 completion-report.md 中归档。

