# Browser Audit Checklist — public-ui-and-editor-overhaul

> 浏览器逐页人工审查清单。Implementation 完成所有代码 + 跑过 typecheck/lint/test/build 四绿之后执行。
> 每个路由 × 两个模式（light + dark）× 5 维度（layout / typography / contrast / state / markdown）= 120 个 checkbox。
> 失败一律记入文末 issue-log；issue 全清空前不允许归档 SDD。

---

## 0. 准备

### 0.1 启动 dev server

```bash
pnpm docker:dev          # 起 Postgres + MinIO
pnpm dev                  # 起 Next 16 dev
```

打开浏览器 `http://localhost:3000`。

### 0.2 测试数据准备

确认 DB 含：

- [ ] ≥ 10 篇 PUBLISHED 文章（至少 1 篇含 cover、tags、column）
- [ ] ≥ 3 个 column（至少 1 个含 ≥ 3 篇文章）
- [ ] ≥ 5 条 PENDING 评论 + ≥ 5 条 APPROVED 评论
- [ ] ≥ 6 条 media 记录
- [ ] 至少 1 篇文章包含**完整 markdown 套件**（5 种 callout + 多语言 code block + table + nested list + task list + kbd + footnote + image），用于 markdown-reading 视觉审查；可用 `src/lib/markdown/__fixtures__/full-syntax.md` 内容 seed 或 admin 直接粘贴

若数据不足，跑 `pnpm db:seed` 或 admin 创建。

### 0.3 浏览器准备

- 使用 Chrome / Edge 最新版（DevTools / Lighthouse 可用）
- 屏幕尺寸至少跑两组：1440×900（桌面）+ 375×812（移动）
- 准备截图工具（macOS `Cmd+Shift+4`），归档到 `audit/<mode>/<route-slug>.png`
- 切换 dark mode：打开页面后通过 DevTools 加 `<html class="dark">` 或在 admin 加 theme toggle（如未实现则手动 toggle）

---

## 1. 审查维度（五维）

每个路由都要按以下 5 维审查。每维有具体子项。

### 维度 A：Layout

- [ ] A1. 视口宽度 1440：是否有横向滚动？（不应有）
- [ ] A2. 视口宽度 375：是否有横向滚动？hero 字号是否过大溢出？
- [ ] A3. section 间距是否使用 `var(--space-section)`（保持节奏）？
- [ ] A4. max-w 容器是否一致（`/`、`/about`、`/posts`、`/posts/[slug]` 都是 max-w-3xl）？
- [ ] A5. footer 是否贴底（短页面不能浮在屏幕中央）？

### 维度 B：Typography

- [ ] B1. h1 / h2 / h3 字号阶梯是否清晰（`var(--text-h1)` / `--text-h2` / `--text-h3`）？
- [ ] B2. 正文 line-height ≈ 1.65（`--leading-body`）？
- [ ] B3. 中文字符是否换行正常（不出现 break-all 截断）？
- [ ] B4. font-serif 标题 + font-sans 正文混排是否协调？
- [ ] B5. 单行字符数控制在 65-85 之间（max-w-[65ch]）？

### 维度 C：Contrast / Color

- [ ] C1. 正文 fg on bg 视觉对比清晰（应 ≥ 12:1，AAA）
- [ ] C2. muted-fg 文本（subtitle / helper / sidebar nav）应清晰可读，**不再灰白**
- [ ] C3. 链接颜色与正文区分但不刺眼
- [ ] C4. accent 色与 destructive 色仅用于必要场景
- [ ] C5. 边框 `--border` 在 light/dark 都恰当可见

### 维度 D：State（hover / focus / active / empty / error / loading）

- [ ] D1. 所有可点击元素 hover 视觉变化（按钮 / 链接 / 卡片 / table row）
- [ ] D2. 键盘 Tab focus-visible ring 出现，使用 `--ring`
- [ ] D3. sidebar / tab nav active state 明确（border-left / bg / fg）
- [ ] D4. 空状态有 EmptyState 组件 + 友好中文文案
- [ ] D5. 错误状态（API 失败 / 表单错误）有 toast / banner
- [ ] D6. loading skeleton 或 spinner 存在（如适用）

### 维度 E：Markdown / 内容渲染

- [ ] E1. 五个 callout 类型颜色清晰、icon 显示、light/dark 都达标
- [ ] E2. code block 顶部 chrome bar 显示 language + 可选 filename + 复制按钮
- [ ] E3. code block 高亮 light/dark 切换平滑（无 layout shift）
- [ ] E4. 复制按钮点击有反馈（toast / 状态变化）
- [ ] E5. table 横向滚动可用 + zebra 行
- [ ] E6. nested list / task list / kbd 视觉正确
- [ ] E7. inline code 与 code block 区分清晰
- [ ] E8. 链接 hover 颜色 / 下划线变化
- [ ] E9. blockquote 视觉正确（serif italic + left border）

---

## 2. 必审路由清单（12 个）

下面每个路由 × Light + Dark 各 5 维度 = 10 个 checkbox。逐项审查后标 ✅ / ⚠️ / ❌。

### 2.1 `/`（首页）

#### Light mode

- [ ] A1 / A2 / A3 / A4 / A5
- [ ] B1 / B2 / B3 / B4 / B5
- [ ] C1 / C2 / C3 / C4 / C5
- [ ] D1 / D2 / D3 / D4 / D5 / D6
- [ ] E（无 markdown 主体；E 维度跳过 / 仅检查 HomeFeaturedAndRecent 中 PostCard excerpt 视觉）

特定检查：

- [ ] HomeHero 三段叙事文字渲染（eyebrow + h1 + lede）
- [ ] HomeHero CTA 双按钮 hover 状态
- [ ] dot-grid + noise overlay 可见但不刺眼
- [ ] reveal 入场动效（首次访问）
- [ ] HomeFeaturedAndRecent featured 大卡 + recent 5-8 篇
- [ ] HomeColumns 卡片网格 + hover 上浮 2px
- [ ] HomePrinciples 4 张卡，mono 编号清晰
- [ ] TechStack 5 分类 + hover tooltip
- [ ] GithubCard 内容渲染或 fallback
- [ ] HomeStats mono 单行
- [ ] 文案统一中文（无 "View all" 等英文 chrome）

截图: `audit/light/home.png`

#### Dark mode

- [ ] 同上所有项重审
- [ ] 特别：dot-grid 颜色调暗合理 / launch-orbit 不刺眼

截图: `audit/dark/home.png`

---

### 2.2 `/about`

#### Light mode

- [ ] A / B / C / D 同上
- [ ] E：本页有 markdown 风格代码片段（如 AboutImplementationApproach），按 E2 / E3 审查
- [ ] AboutHero 字号 / 副标题 / Now badge
- [ ] AboutNow 4 列（Shipping / Writing / Reading / Hardening）
- [ ] AboutProjectIntent 三段散文 + 具体事实
- [ ] AboutTechStack id="tech-stack" + 5 分类 + rationale
- [ ] `/about#tech-stack` URL 直接访问能锚定
- [ ] AboutImplementationApproach 4 项 + 代码片段视觉
- [ ] AboutPrinciples 6-8 张卡
- [ ] AboutFutureRoadmap 3 列 + **含 "中文单语言" 文字**
- [ ] AboutContact 邮件 + 社交链接 hover

截图: `audit/light/about.png`

#### Dark mode

- [ ] 同上重审

截图: `audit/dark/about.png`

---

### 2.3 `/posts`

#### Light mode

- [ ] A / B / C / D 同上
- [ ] PostCard 完整渲染 cover + title + excerpt + tags + meta
- [ ] 分页 prev / next + 当前页码
- [ ] 空状态（URL 加 filter 无结果时）

截图: `audit/light/posts.png`

#### Dark mode

- [ ] 同上重审

截图: `audit/dark/posts.png`

---

### 2.4 `/posts/[slug]`（用完整 fixture markdown 文章）

#### Light mode

- [ ] A / B / C / D 同上
- [ ] **E 全部 9 项审查（核心）**
- [ ] cover banner 渲染（`aspect-[3/1]`）
- [ ] hero header：date + column + title + excerpt + stats
- [ ] markdown body 完整渲染
- [ ] right sidebar TOC sticky 跟随滚动
- [ ] TOC active item 高亮
- [ ] like button mount-GET 初态正确
- [ ] like button 点击乐观更新
- [ ] comment section 加载
- [ ] tags 末尾链接到 `/tags/<slug>`

截图: `audit/light/post-detail.png`

#### Dark mode

- [ ] 同上重审，**特别注意 code block 切到 dark theme**

截图: `audit/dark/post-detail.png`

---

### 2.5 `/admin`（Dashboard）

#### Light mode

- [ ] A / B / C / D 同上
- [ ] AdminSidebar：5 个 nav item，无 analytics/settings；active item 高亮
- [ ] AdminHeader：breadcrumb（如已实施）+ 用户 dropdown
- [ ] MetricCard × 3 + RangeSelector + TrendChart + TopList × 2 + DistributionBar × 2
- [ ] hover / focus 状态完整

截图: `audit/light/admin-dashboard.png`

#### Dark mode

- [ ] 同上重审

截图: `audit/dark/admin-dashboard.png`

---

### 2.6 `/admin/posts`（列表）

#### Light mode

- [ ] A / B / C / D 同上
- [ ] PostsFilters：搜索框 + 3 个 Select + Reset 按钮（如有 filter active）
- [ ] PostsTable：zebra + hover row + 圆角容器
- [ ] 行内 dropdown 操作菜单
- [ ] 删除 AlertDialog 确认
- [ ] 分页

截图: `audit/light/admin-posts.png`

#### Dark mode

- [ ] 同上重审

截图: `audit/dark/admin-posts.png`

---

### 2.7 `/admin/posts/new`（编辑器创建）

#### Light mode

- [ ] A / B / C / D 同上
- [ ] **核心契约审查**：
  - [ ] 左侧编辑区显示 markdown 字面字符（输入 `**bold**` 屏幕显示是 `**bold**` 五个字符，不是 **粗体**）
  - [ ] 左侧编辑区有行号
  - [ ] 左侧编辑区有轻 syntax highlight（heading 微 bold，code fence 块状底）
  - [ ] tab 缩进 2 空格
  - [ ] ctrl+s 保存（preventDefault + 调 onSave）
  - [ ] placeholder 显示
- [ ] **toolbar 行为审查**：
  - [ ] Bold / Italic / Code / H2 / H3 / UL / OL / Quote / Code Block / Link / Image / Table / Callout 全部按钮
  - [ ] Bold 包裹选中
  - [ ] Callout 弹出 NOTE / TIP / IMPORTANT / WARNING / CAUTION 子选项
  - [ ] Link 弹 dialog
  - [ ] Image 弹媒体库 dialog
- [ ] **右侧预览审查**：
  - [ ] debounce 200ms
  - [ ] 渲染与发布态一致（callout 五个 / code chrome bar / table / list）
  - [ ] code block 复制按钮可用
  - [ ] 错误 markdown 显示 banner
- [ ] PostMetaSidebar：slug / cover / status / column / tags / publishedAt 正常

截图: `audit/light/editor-new.png`

#### Dark mode

- [ ] 同上重审

截图: `audit/dark/editor-new.png`

#### Round-trip 测试（手动）

- [ ] 用本地 `__fixtures__/full-syntax.md` 内容粘贴到编辑区
- [ ] 立即点 "Save Draft"
- [ ] 重新加载页面
- [ ] 验证编辑区显示的字符串与原 fixture 字面完全相同（diff 工具复核）

---

### 2.8 `/admin/posts/[id]/edit`（编辑器编辑）

#### Light mode

- [ ] 所有 `posts/new` 的项重审
- [ ] **加载已有内容 round-trip**：DB content 字面回填到编辑区
- [ ] 编辑后保存不漂移

截图: `audit/light/editor-edit.png`

#### Dark mode

- [ ] 同上重审

截图: `audit/dark/editor-edit.png`

---

### 2.9 `/admin/comments`

#### Light mode

- [ ] A / B / C / D 同上
- [ ] 4 status tab 切换 + active 状态
- [ ] Status Badge token-driven，4 种状态视觉区分
- [ ] BulkActions bar 多选触发
- [ ] 行内 操作（通过/垃圾/拒绝/删除）
- [ ] AlertDialog 删除确认

截图: `audit/light/admin-comments.png`

#### Dark mode

- [ ] 同上重审

截图: `audit/dark/admin-comments.png`

---

### 2.10 `/admin/columns`

#### Light mode

- [ ] A / B / C / D 同上
- [ ] ColumnsTable + reorder
- [ ] 编辑 dialog + 删除 AlertDialog

截图: `audit/light/admin-columns.png`

#### Dark mode

- [ ] 同上重审

截图: `audit/dark/admin-columns.png`

---

### 2.11 `/admin/media`

#### Light mode

- [ ] A / B / C / D 同上
- [ ] MediaUploadDropzone hover / drag-over 状态
- [ ] media grid 缩略图
- [ ] 卡片操作菜单

截图: `audit/light/admin-media.png`

#### Dark mode

- [ ] 同上重审

截图: `audit/dark/admin-media.png`

---

### 2.12 `/login`

#### Light mode

- [ ] A / B / C / D 同上
- [ ] 表单 label / helper / error
- [ ] 提交错误 toast
- [ ] focus ring 在 light mode 清晰

截图: `audit/light/login.png`

#### Dark mode

- [ ] 同上重审

截图: `audit/dark/login.png`

---

## 3. 额外审查项

### 3.1 移动端（375px）

至少抽查以下路由在 375px 视口下：

- [ ] `/` HomeHero 字号自适应（clamp 工作）
- [ ] `/posts` 列表项布局
- [ ] `/posts/[slug]` cover banner 不溢出 + TOC 隐藏
- [ ] `/admin/posts` 列表是否横向滚动 OK
- [ ] `/admin/posts/new` 编辑器 mobile tab 切换（编辑 / 预览）

### 3.2 reduced-motion

- [ ] DevTools "prefers-reduced-motion" 切到 reduce
- [ ] 浏览 `/`、`/about`：reveal 动效跳过 / launch-orbit 静止 / hover 立即变化（无 transition）

### 3.3 颜色辅助

- [ ] Chrome DevTools Lighthouse Accessibility audit（首页 / 详情页 / admin）≥ 90
- [ ] DevTools "Issues" 不报对比度警告

### 3.4 性能

- [ ] Lighthouse Performance 首页 desktop ≥ 90（dev mode 仅参考）
- [ ] 编辑器加载长 markdown 不卡顿（手动感觉）

---

## 4. issue-log

> 每发现一个缺陷写一行；implementation 修复后打勾。

格式：`| # | 路由 | 模式 | 维度 | 现象 | 严重度 | 修复 commit | 状态 |`

严重度：`P0`（阻塞归档） / `P1`（强烈建议修） / `P2`（next-iteration 可推）

| # | 路由 | 模式 | 维度 | 现象 | 严重度 | 修复 commit | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | (待填) | (light/dark) | (A-E) | (描述) | (P0/P1/P2) | (commit-hash) | (open/fixed) |

执行方在 M3-C 阶段填表；所有 P0 必须 close 才允许归档。

---

## 5. 归档要求

完成所有 120 个 checkbox + 修完所有 P0 issue 后：

- [ ] 全部截图归档到 `.claude/sdd/public-ui-and-editor-overhaul/audit/{light,dark}/<route>.png`
- [ ] 本文件勾选完整状态保存
- [ ] `completion-report.md` 中引用本文件并附 issue-log 摘要
- [ ] ha1den 复审 → 通过后 `git mv` 归档
