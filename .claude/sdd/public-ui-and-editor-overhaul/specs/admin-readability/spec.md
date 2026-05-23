# Spec — admin-readability

> Capability：后台 admin 系统性可读性 / 设计修复。
> 范围：layout / sidebar / header / token 对比度 / active state / 表格密度 / Comments Badge / 空状态 / 危险操作。
> 上游：`design-notes.md §2, §8`、`design-research.md §6`、`incomplete-pages-inventory.md §3.1`。
> 不动：业务逻辑 / API / DB / 各 admin 页面的功能字段。

---

## AR-1 sidebar 接通独立组件 + 死链清理

### AR-1.1 引入 `<AdminSidebar>`

**GIVEN** `src/components/admin/AdminSidebar.tsx` 已存在（但 layout 未引用）；layout.tsx 当前内联 aside + nav
**WHEN** 实施
**THEN** layout.tsx 改成 `<AdminSidebar />`；内联 nav 删除；NAV_ITEMS 常量从 layout.tsx 移到 AdminSidebar 内部（或 `src/lib/admin/nav.ts` 单独文件）。

### AR-1.2 NAV_ITEMS 删除 analytics / settings

**GIVEN** 当前 NAV_ITEMS 含 `/admin/analytics` 与 `/admin/settings`
**WHEN** 实施
**THEN** NAV_ITEMS 减少到 5 项（概览 / 文章 / 专栏 / 评论 / 媒体）；不出现 `/admin/analytics`、`/admin/settings`、`/admin/_editor-demo`。

### AR-1.3 sidebar 死链测试

**GIVEN** AdminSidebar 渲染
**WHEN** jsdom 查询所有 `<a>` link
**THEN** 每个 href 对应文件存在（`src/app/(admin)/admin/{posts,columns,comments,media}/page.tsx` 都存在）；编译时不允许残留 `/admin/analytics`、`/admin/settings`、`/admin/_editor-demo`。

---

## AR-2 sidebar active state

### AR-2.1 active 视觉

**GIVEN** 用户访问 `/admin/posts`
**WHEN** sidebar 渲染
**THEN** "文章" link 容器 `data-active="true"`；CSS 应用 `border-left: 2px solid hsl(var(--sidebar-indicator-active)); background: hsl(var(--sidebar-bg-active)); color: hsl(var(--sidebar-fg-hover)); font-weight: 500;`；其它 link `data-active="false"` 用默认样式。

### AR-2.2 active 匹配规则

**GIVEN** `usePathname()` 返回当前路径
**WHEN** sidebar 计算每项 active 状态
**THEN** "概览" 在 `pathname === "/admin"` 时 active；其它（`/admin/posts`、`/admin/posts/123/edit`、`/admin/posts/new`）应让 "文章" active（`pathname.startsWith("/admin/posts")`）；同理 columns / comments / media 各自 startsWith。

### AR-2.3 active state 测试

**GIVEN** RTL render with mocked usePathname
**WHEN** pathname 是 `/admin/posts/new`
**THEN** 断言文章 link 容器 `getAttribute("data-active") === "true"`；其它 link `data-active === "false"`。

---

## AR-3 muted-fg 对比度调亮

### AR-3.1 light mode token 更新

**GIVEN** 当前 `:root { --muted-fg: 220 9% 46%; }` 对比度 ~4.6:1
**WHEN** 实施
**THEN** 更新为 `--muted-fg: 220 13% 36%;`（或 implementation 实测后微调，但 light mode 必须 ≥ 5.5:1 on `--bg`）；同时新增 `--muted-fg-strong: 220 15% 24%;`、`--sidebar-fg`、`--sidebar-fg-hover` 等 design-notes §2.1 列出的全部 token。

### AR-3.2 dark mode token 同步

**GIVEN** dark mode `:root.dark { --muted-fg: 240 5% 65%; }` 当前 ~5.8:1
**WHEN** 实施
**THEN** 微调到 `240 5% 70%`（design-notes §2.1）；新增 `--muted-fg-strong: 210 20% 90%;`、`--sidebar-*` 完整。

### AR-3.3 影响面 sweep

**GIVEN** 全项目用了 `text-muted-fg` 或 `hsl(var(--muted-fg))`
**WHEN** 实施
**THEN** grep 检查所有使用点（应该 50+ 处），visual 确认 light mode 文本不再"灰白"难辨；不允许任何使用点因 token 调整导致对比度反而下降。

### AR-3.4 对比度断言

**GIVEN** 测试 `src/app/globals.test.ts` 类
**WHEN** 实施 AR-3
**THEN** 新增 spec 解析 CSS variable 值 + 计算对比度（用一个简单的 `oklch-to-luminance` 或 `hslToContrast` helper，测试 only）；断言 `--muted-fg` on `--bg` ≥ 5.5:1（light）和 ≥ 5.0:1（dark）。

---

## AR-4 按钮 / Form / 危险操作统一

### AR-4.1 按钮规格统一

**GIVEN** admin 各处用 shadcn `<Button>`
**WHEN** 实施
**THEN** 所有按钮的 size / radius / font-weight / hover / focus 状态由 shadcn 默认 + 项目 token 决定，统一；不再在某些页面 hardcode `bg-blue-500`。

### AR-4.2 危险操作

**GIVEN** 行内"删除"按钮（如 Posts 表格 dropdown 中的"删除"）
**WHEN** 渲染
**THEN** 使用 `<button class="text-destructive hover:bg-destructive/10">`；trigger 后弹 AlertDialog（已实施，保留）；AlertDialog 内 confirm 按钮用 `<Button variant="destructive">`。

### AR-4.3 Form helper / error

**GIVEN** admin 表单（如 PostEditor metadata sidebar）
**WHEN** 实施
**THEN** form helper text 用 `text-sm text-muted-fg`（依赖 AR-3）；error text 用 `text-sm text-destructive`；label 用 `text-sm font-medium text-fg`；不允许某些字段用 inline color hardcode。

### AR-4.4 focus ring 统一

**GIVEN** 所有 admin focus-visible
**WHEN** 实施
**THEN** focus-visible 用 `--ring` token（已有）；ring offset 2px；color `hsl(var(--ring))`；不允许某些按钮残留 `outline: 1px dotted black`。

---

## AR-5 Comments Badge 改 token

### AR-5.1 当前问题

**GIVEN** `src/components/admin/comments/CommentsTable.tsx` 当前用 inline hardcoded color class（如 `bg-amber-100 text-amber-800`）
**WHEN** 实施
**THEN** Badge 改用 token-driven。在 globals.css 加 4 个 status token：

```css
--status-pending-bg: 38 100% 90%;
--status-pending-fg: 38 92% 30%;
--status-approved-bg: 155 60% 90%;
--status-approved-fg: 155 58% 28%;
--status-spam-bg: 0 80% 92%;
--status-spam-fg: 0 70% 38%;
--status-rejected-bg: 220 14% 92%;
--status-rejected-fg: 220 14% 36%;
```

dark mode 对偶。Badge 用 `style={{ background: \`hsl(var(--status-${status.toLowerCase()}-bg))\`, color: \`hsl(var(--status-${status.toLowerCase()}-fg))\` }}` 或 class data-attribute driven。

### AR-5.2 视觉对比度

**GIVEN** 每个 status Badge
**WHEN** light 和 dark
**THEN** fg on bg ≥ 4.5:1（WCAG AA）；执行方实测调整 token 值。

### AR-5.3 测试

**GIVEN** CommentsTable.test.tsx
**WHEN** 实施
**THEN** 测试断言 Badge 不再有 `amber-100`/`green-100` 等 hardcoded class；改用 data-status attribute 或 token-driven style。

---

## AR-6 表格视觉升级

### AR-6.1 zebra + hover

**GIVEN** PostsTable / ColumnsTable / CommentsTable 当前无 zebra
**WHEN** 实施
**THEN** 在 `globals.css` 加：

```css
.admin-table tbody tr:nth-child(odd) { background: hsl(var(--table-row-zebra)); }
.admin-table tbody tr:hover { background: hsl(var(--table-row-hover)); }
```

各 admin 表格容器加 `admin-table` class（或同等 mechanism）。

### AR-6.2 th 视觉

**GIVEN** table th
**WHEN** 渲染
**THEN** th 用 mono 字体 uppercase tracking-label，背景 `hsl(var(--table-th-bg))`，font-weight 500；删除当前各 table 中可能存在的 inline override。

### AR-6.3 table 圆角与 overflow

**GIVEN** table
**WHEN** 渲染
**THEN** table 容器 `<div class="rounded-md border bg-card overflow-hidden">` 包；table 本身 `w-full`；row 边线用 border-border。

### AR-6.4 PostsFilters 加 Reset 按钮

**GIVEN** `src/components/admin/posts/PostsFilters.tsx` 当前无 reset
**WHEN** 实施
**THEN** 新增 "重置" 按钮，点击清空 q / status / column / tag URL 参数；只在有筛选条件激活时显示（避免空 reset 噪音）。

---

## AR-7 Header / TopBar 升级

### AR-7.1 breadcrumb（可选）

**GIVEN** admin layout header
**WHEN** 实施
**THEN** **可选**：基于 `usePathname` 渲染 breadcrumb（如 "Dashboard / Posts / New"）；如复杂可暂缓到 V2，本轮至少把 email + logout 排版与 sidebar tokens 一致化。

### AR-7.2 user menu 改 dropdown

**GIVEN** 当前 header 只是 email + logout 按钮
**WHEN** 实施
**THEN** 改成 shadcn DropdownMenu，trigger 是 email / 头像 placeholder，dropdown 含"登出"。**视觉而非功能升级**。

---

## AR-8 空状态统一

### AR-8.1 `<EmptyState>` 组件

**GIVEN** admin 各表格 / 列表的空状态当前文案分散
**WHEN** 实施
**THEN** 新建 `src/components/admin/EmptyState.tsx`：

```tsx
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}
```

PostsTable / CommentsTable / ColumnsTable / MediaPage 空状态全部用此组件；视觉一致（dashed border + py-16 + icon + title + description + optional CTA）。

### AR-8.2 各页空状态文案

**GIVEN** EmptyState 接入
**WHEN** 各页实施
**THEN** 文案：
- 文章："暂无文章 · 点击「新建文章」开始创建"
- 评论："这个状态下还没有评论"
- 专栏："还没有专栏 · 创建一个开始整理"
- 媒体："还没有媒体 · 在文章里上传图片自动归档"

不允许出现 "no data" / "empty" 等英文 placeholder。

---

## AR-9 dark mode 全后台验证

### AR-9.1 admin 所有页面 dark mode 验证

**GIVEN** admin dark mode 切换
**WHEN** 浏览器审查
**THEN** 各页面（dashboard / posts / posts/new / columns / comments / media）在 dark mode 下：
- 文字对比 ≥ 5.5:1
- table zebra / hover 在 dark mode 下也可见但不刺眼
- Badge 状态色仍可识别
- focus ring 在 dark mode 下可见
- AlertDialog 视觉与 light 一致

测试覆盖具体见 `browser-audit-checklist.md`。

---

## AR-10 测试覆盖

### AR-10.1 AdminLayout 测试

**GIVEN** 当前 `src/app/(admin)/admin/layout.test.tsx`（如有）或新建
**WHEN** 实施
**THEN** 测试断言：layout 用 AdminSidebar 组件 / sidebar 不含 analytics&settings link / active state 切换正确 / muted-fg 类应用到 sidebar nav。

### AR-10.2 token 对比度测试

**GIVEN** `src/app/globals.test.ts`
**WHEN** 实施
**THEN** 新增 spec：从 CSS 文本提取 `--muted-fg` 值（light + dark）+ 计算对比度断言（参考 AR-3.4）。

### AR-10.3 EmptyState 单测

**GIVEN** 新 EmptyState 组件
**WHEN** 测试
**THEN** 渲染 title / description / 可选 action / 可选 icon；点击 action 触发 callback / 跳转 href。

### AR-10.4 现有 admin 测试不退化

**GIVEN** PostsTable.test.tsx / CommentsTable.test.tsx / ColumnsTable.test.tsx / MetricCard.test.tsx
**WHEN** 实施
**THEN** 全部通过；如因 Badge token 改动需调整，调整测试 expectation 但不弱化（继续断言"四种状态视觉可区分"）。
