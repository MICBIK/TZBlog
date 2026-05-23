# public-ui-and-editor-overhaul · proposal

> Feature ID: `public-ui-and-editor-overhaul`
> 发起人：ha1den
> 起草日期：2026-05-23
> 阶段：proposal（未开始 implementation）
> 上游：`.claude/sdd/public-launch-polish/`（已交付一版，本轮按用户明确指示**默认视为不达标**，整体重做）

---

## 1. 问题陈述（Problem）

TZBlog 已经完成 MVP 上线前的所有功能闭环（CMS、评论、点赞、自研 Analytics、SEO/feed、媒体上传），并且经过一轮 `public-launch-polish` 给前台、后台和 Markdown 阅读做了表层打磨。但根据 ha1den 在 2026-05-23 的复审，**当前实现整体不达标**，问题集中在六处：

### 1.1 Markdown 阅读体验仅"差强人意"

- 服务端 `renderMarkdown` 已支持 GitHub-style alerts（NOTE/TIP/IMPORTANT/WARNING/CAUTION），但视觉差异主要靠左 border 颜色 + 渐变背景，**没有清晰可辨的色彩-图标-排版三轨体系**（`src/app/globals.css:441-504`）。
- Shiki 主题硬编码为 `github-dark-default`（`src/lib/markdown.ts:52`），**light mode 下代码块与正文反差刺眼**；没有 light/dark 双主题切换基础设施。
- `.markdown-body`（`src/app/globals.css:281-505`）对 `h1-h6/a/code/pre/blockquote/table/list/hr/alert` 都有定义，但 callout 色值硬编码、无统一 `--callout-*` semantic token、code block 无文件名/语言/复制按钮、table 无横向滚动指示、nested list / task list / footnote / kbd 等边缘元素未覆盖。
- 测试只断言 alert 存在 / heading id 字面一致 / XSS 防护，**完全没有视觉对比、light-dark token 一致性、edge case 断言**。

### 1.2 编辑器源码契约**严重偏离 systemPatterns §14**

- `systemPatterns.md:172-176` 写明："编辑区必须保留 Markdown 原文"。
- 实际实现（`src/components/editor/MarkdownEditor.tsx:80-84`）用 `Tiptap v3 + tiptap-markdown` + ProseMirror，并显式给编辑区加 `"prose prose-neutral dark:prose-invert max-w-none"` —— **左侧编辑框给用户看的是渲染后的富文本（标题变大、列表缩进、代码块带背景）**，不是 markdown 源码。
- 加载已有文章时，`editor.commands.setContent(value)`（`MarkdownEditor.tsx:100`）走 `markdown → ProseMirror AST → 内存 → editor.storage.markdown.getMarkdown()` 的往返；任何 tiptap-markdown 序列化不全的语法（GFM alerts、任务列表、脚注、HTML 内联、特殊空格、不同 list 风格）都会被默默改写，原作者的 Markdown 风格丢失。
- 这违反了用户对"双栏编辑器"的基本预期：**左侧 source / 右侧 preview**。当左侧不再是 source，双栏的设计本身失去意义。

### 1.3 右侧预览与发布态不一致

- `MarkdownEditorWithPreview.tsx:128` 自带一个 ~130 行的 `miniRenderMarkdown` 客户端 mini-renderer。
- 该 mini-renderer **不支持** GitHub alerts、Shiki 代码高亮、autolink-headings、GFM 表格扩展、footnote、task list、strikethrough（仅基础支持）。
- 即使作者输入完全合法的 `> [!WARNING]` block，预览也只显示为普通 blockquote，与发布后的 `<aside class="markdown-alert markdown-alert-warning">` 渲染完全不同。
- 第 21 行的代码注释 `TODO: swap in 'marked' + 'DOMPurify' when those land.` 自承现状不达标。

### 1.4 首页 + About 页是"成熟骨架"而非"成品"

- 现有 sections 结构合理（HeroEditorial / LaunchNarrative / TechStack / GithubCard / Recent Posts / Site Stats；About: AboutHero / AboutNow / AboutStory / AboutPrinciples / AboutContact），但信息密度低、缺乏个人技术叙事、Recent Posts 仅 3 篇无"更多"导引、Stats 行过于干瘪。
- 唯一的视觉装饰是 `launch-surface` radial-gradient + `launch-orbit` 旋转动画，整体氛围**单调**。
- About 内容不足以支撑"项目定位/技术选型/实现思路/写作目的/后续方向/工程原则"六个维度，每段只有 2-4 行散文。
- dark mode 未做专项视觉验证。

### 1.5 后台可读性是系统性问题，不止 sidebar

- Light mode `--muted-fg = 220 9% 46%` (~#64748b) on `--bg = white` 对比度仅 **4.6:1**（WCAG AA 边界）。
- 长时间审核评论 / 浏览文章列表会疲劳。
- Admin 没有 active state 视觉标记（用户无法识别当前在哪个页面）。
- `/admin/_editor-demo` 是开发工具不该暴露在导航。
- `/admin/analytics` 和 `/admin/settings` **导航里有链接但页面不存在**。
- 表格行高紧（py-1.5），危险操作虽有 AlertDialog 但没有统一的视觉权重梯度。
- 完全没有视觉回归测试。

### 1.6 多语言被模糊处理

- `SUPPORTED_LOCALES = ["zh", "en"]` 和 Prisma `*Translation` 子表只是数据模型预留。
- `getCurrentLocale()` (`src/lib/i18n.ts:8-10`) 硬编码返回 `"zh"`。
- 无 `app/[lang]` 路由、无 proxy locale negotiation、无 dictionary、无 next-intl。
- `generateMetadata`、`/rss.xml`、`/sitemap.xml`、`opengraph-image.tsx` 全部单 locale 输出，无 `alternates.languages` / `hreflang` / `<language>` 字段。
- UI 文案中英文混乱硬编码（SiteHeader 用 "Blog/Columns/About"，首页同时出现 "所有文章" 和 "View all"）。
- PostEditor 提交时硬编码 `locale: "zh"`（`PostEditor.tsx:54-59`），即使 DB 有 en 翻译也无法编辑切换。
- KI-004 已记录但当前 README/About 文案没有明确说"现阶段是中文单语言站点"，存在"看起来支持多语言但其实不支持"的误导风险。

---

## 2. 本轮范围（Scope）

按 ha1den 任务清单 12 条全部纳入。拆成 **8 个 capability**，每个对应一个 spec 子目录：

| Capability slug | 中文标签 | 主要交付 |
|---|---|---|
| `markdown-reading` | Markdown 阅读体验重做 | callout/code/table/list/alert 全套阅读 token + 服务端 light/dark Shiki 双主题 + 新增 code block 行为（文件名/语言徽章/复制按钮）|
| `editor-source-contract` | 编辑器源码契约修复 | 替换 Tiptap 富文本为真正的 Markdown source editor（textarea / 轻量 CM6 / 自研可控方案）|
| `editor-preview-parity` | 预览一致性修复 | 右侧预览改走服务端 `renderMarkdown` debounced（或 client-side 完整 unified 管道）|
| `home-redesign` | 首页系统性重做 | hero 叙事强化、stack/process/recent posts 重组、背景层次和动效克制升级 |
| `about-redesign` | About 页系统性重做 | 围绕项目定位/选型/实现/写作目的/后续/原则六维度展开 |
| `admin-readability` | 后台可读性与设计修复 | 全套 admin token 提对比度、active state、empty state、危险操作、表格密度、缺失页面收口 |
| `incomplete-pages-inventory` | 未完成页面盘点 | 全部 public/admin 路由完成度评级 + 本轮处理决定 |
| `i18n-current-state-audit` | 多语言现状梳理 | 不实施多语言迁移，**只**输出现状审计 + V3 SDD 准入条件 |

设计研究、参考案例和决策原则单独沉淀在 `design-research.md` 与 `design-notes.md`（非 spec，是支撑材料）。

V2/V3 延后项与浏览器逐页审查清单分别落在 `deferred-v2-v3.md` 和 `browser-audit-checklist.md`。

## 3. 明确不做（Out of Scope）

本轮**刻意不做**以下事项，理由记入 [deferred-v2-v3.md](./deferred-v2-v3.md)：

1. **多语言实际迁移**：不做 `app/[lang]` route migration、dictionary 接入、metadata/RSS/sitemap locale-aware 输出、Header 语言切换器、英文内容录入。理由：路由树整体迁移影响面 ≥30 文件 + SEO/feed 全链路改造，本轮设计是 polish 不是 architectural rewrite。仅在文档中详尽记录现状与 V3 SDD 准入条件。
2. **主题 GUI 编辑**：不在后台加色板编辑器或多套预设主题切换。理由：V2 backlog 明确，需要 schema 改动。
3. **编辑器功能增强**（脚注/数学公式/拖拽上传图片/表格 wizard）：理由：V2 backlog；本轮源码契约修复优先。
4. **评论邮件通知**：V2 backlog。
5. **Lighthouse 95+ 调优**：与本轮 UI 改造分桶，等部署上线后基于真实数据做。
6. **DB schema 改动**：本轮仅前端 + Markdown 渲染管道 + UI token，不涉及任何 migration。
7. **替换 Auth.js / Prisma 等基础设施**：完全不动。
8. **Playwright E2E 框架引入**：技术债务，等部署后单开 SDD。本轮浏览器审查走人工 + manual smoke + 截图对照。
9. **新增三方依赖**（CM6 / monaco / shadcn 新组件）：除非 spec 显式要求且已通过本 proposal 评审。本轮目标包含编辑器替换，**允许**在 spec 中提议**最多一个**轻量编辑器依赖（CM6 / Lexical 或纯 textarea + 自研增强），但需在 design-notes 中说明选型决策。

## 4. 成功标准（Success Criteria）

按 ha1den 的"重点验收标准"扩展：

### 4.1 Markdown 阅读

- **MR-S1**：callout 五个变体（NOTE/TIP/IMPORTANT/WARNING/CAUTION）在 light 和 dark mode 下都有独立色彩 / 图标 / 标题排版三轨视觉，且在两种模式下都达到 WCAG AA 对比（≥4.5:1）。
- **MR-S2**：code block 在 light mode 用 light 主题（如 `github-light` / `min-light`），在 dark mode 用 dark 主题（`github-dark-default` 或 `min-dark`），切换由 `<html class="dark">` 控制，**无 layout shift**。
- **MR-S3**：code block 顶部带语言徽章 + 复制按钮；inline code 与 code block 有清晰区分（border / 圆角 / 背景层次）。
- **MR-S4**：table、blockquote、list（含 nested）、hr、kbd（如有）都在 light/dark 下视觉一致、对比达标。
- **MR-S5**：`.markdown-body` 覆盖范围用快照测试或 DOM 断言锁定。

### 4.2 编辑器源码契约

- **EC-S1**：打开 `/admin/posts/new` 时，左侧编辑区显示**字符串形式的 markdown 源码**（包括 `**bold**`、`# 标题`、`> [!NOTE]`、` ```ts `、`| col1 | col2 |` 等），不再是 ProseMirror 富文本。
- **EC-S2**：打开已有文章编辑时，DB 中保存的 markdown 字符串**字面一致地**回填到左侧编辑区（无格式被往返序列化改写）。
- **EC-S3**：保存时提交给后端的 content 与左侧编辑区文本字面一致。
- **EC-S4**：编辑区行号 / tab 缩进（2 空格）/ ctrl+s 保存 / 至少 Markdown 语法染色（可选）三项功能至少有合理基线。
- **EC-S5**：所有现有 PostEditor 集成测试在源码契约切换后仍然通过。

### 4.3 预览一致性

- **EP-S1**：右侧预览渲染 GitHub alerts 五个变体的视觉与发布态 `/posts/[slug]` 完全一致（class 名、DOM 结构、文字颜色、背景色）。
- **EP-S2**：右侧预览的代码高亮使用与发布态相同的 Shiki 管道。
- **EP-S3**：右侧预览的 list / table / blockquote / heading 与发布态一致；不允许有 `prose` class 或别的样式分叉。
- **EP-S4**：debounce 时长 150-300ms，长文档（10k 字符）预览不卡顿。
- **EP-S5**：预览失败时显示明确错误（语法错误位置 + 提示），不允许 silent failure。

### 4.4 首页

- **H-S1**：hero 区有清晰的"我是谁 / 我做什么 / 你为什么应该往下看"三段叙事。
- **H-S2**：信息密度比当前增加 30% 以上：增加诸如"工程原则 / 最近思考 / 阅读统计 / 主题专栏入口"等内容入口。
- **H-S3**：背景有可识别的层次（gradient + 几何点缀 + scroll-triggered reveal），但**不**采用营销页常见的大块 SVG blob / 全屏 hero video / 过度动效。
- **H-S4**：dark mode 与 light mode 都经过专项视觉审查，颜色、间距、字号比例都协调。

### 4.5 About

- **A-S1**：覆盖六维度（项目定位 / 技术选型 / 实现思路 / 写作目的 / 后续方向 / 工程原则）每维度都有具体内容，非泛泛而谈。
- **A-S2**：与首页共用 `launch-surface` / `launch-panel` 等 primitive，视觉系统一致。
- **A-S3**：包含至少一项"可信物料"：架构图 / 截图 / 代码片段 / 时间线 / 实际数据。

### 4.6 后台可读性

- **AR-S1**：light mode 下所有 `text-muted-fg` / sidebar nav / table 副字段 / form helper text 对比度 ≥ 4.6:1，**目标 ≥ 5.5:1**。
- **AR-S2**：sidebar 当前页有明确 active state（border-left + bg + text-fg 三轨）。
- **AR-S3**：表单 label / helper / error state 有统一规范，密度合理，dark mode 同步达标。
- **AR-S4**：表格、按钮、空状态、危险操作、面包屑、用户菜单 hover/focus/active 五态都有统一视觉。
- **AR-S5**：缺失页面（`/admin/analytics`、`/admin/settings`、`/admin/_editor-demo`）按本轮决定（实现 / 移除导航 / 移到 V2）处理，不留导航空指针。

### 4.7 未完成页面盘点

- **IP-S1**：所有前台 + 后台路由有完成度评级 + 本轮决定 + 处理 commit。
- **IP-S2**：所有导航 link 真实可达，无 404 死链。
- **IP-S3**：清单文档（`incomplete-pages-inventory.md`）作为本轮交付物之一，未来 P3/P4 / V2 / V3 都从这里取出后续任务。

### 4.8 多语言现状审计

- **I18N-S1**：`i18n-current-state.md` 详尽列出每个 public route / metadata / RSS / sitemap / OG / UI copy 的当前 locale 状态，标注 `placeholder / schema-only / hardcoded-zh / hardcoded-en / mixed` 五类。
- **I18N-S2**：V3 SDD 准入条件清单（路由树迁移、proxy negotiation、dictionary 选型、SEO 全链路、英文内容来源）。
- **I18N-S3**：About / README / sitemap robots 明确写出"现阶段是中文单语言站点"，关闭"看起来多语言"的误导。

---

## 5. 与 `public-launch-polish` 的关系

| 维度 | `public-launch-polish` 已落地 | 本轮 `public-ui-and-editor-overhaul` 做什么 |
|---|---|---|
| Markdown alerts | GH alerts visitor + .markdown-alert 基础样式 | 加 light/dark 完整色彩-图标-排版三轨；统一 `--callout-*` token |
| Code block | Shiki dark hardcoded | 加 light/dark 双主题 + 语言徽章 + 复制按钮 |
| .markdown-body 覆盖 | 主要元素 OK | 补 nested list / task list / kbd / footnote / table responsive |
| Home / About | LaunchNarrative + AboutPrinciples | 重组信息架构、补叙事、补视觉层次和动效 |
| Admin sidebar light | tokens 从 muted-bg 改 muted-fg | 整套 muted-fg 重设、active state、全后台对比度审计 |
| i18n | 记 KI-004 | 系统性审计 + V3 准入条件文档化 + 删除"看起来多语言"的入口 |

**显式声明**：本轮**不**回滚 `public-launch-polish` 的工作。`launch-surface` / `launch-panel` / `.markdown-body` / `.markdown-alert` 这些 primitive 作为本轮的**起点**继续演化。

---

## 6. 风险与回退（Risk & Rollback）

### 6.1 编辑器替换风险（最高）

- **风险**：从 Tiptap + tiptap-markdown 切到 source editor（无论 textarea 还是 CM6）会改变作者输入 UX，可能引入 paste 行为、tab 缩进、自动配对等回归。
- **缓解**：
  1. 先做技术调研选型（design-notes 中 EC-D1 决策），三选一：(A) 纯 `<textarea>` + 自研增强 (B) `@uiw/react-textarea-code-editor` 或同类（轻量 ~15kb） (C) CodeMirror 6 (~70kb gzip)。
  2. 先在 `_editor-demo` 路由跑通新方案，再切到 `PostEditor`。
  3. 保留 tiptap 依赖 1-2 个 commit，回退预案：revert PR。
- **回退**：单 git revert 即可，因为本轮不动 DB / API contract / 提交格式。

### 6.2 Shiki 双主题加载体积

- **风险**：同时打包 light + dark theme + JSON grammars 可能让 client bundle 上涨；本轮渲染在服务端，影响小，但仍需关注 server response size。
- **缓解**：只加载实际用到的 grammars（按 `posts` 表统计 top 5-10 语言），其它 lazy / fallback；用 `<noscript>` 友好降级。

### 6.3 视觉回归无自动化

- **风险**：本轮不引入 Playwright；视觉变更靠浏览器人工逐页审查 + 截图。改动多时容易遗漏。
- **缓解**：`browser-audit-checklist.md` 列出 7 个核心路由 × 5 维度（布局 / 排版 / 颜色 / 状态 / Markdown）的 35 个 checkbox；每个 capability done 时执行方填写 issue-log；最终归档前 ha1den 复审。

### 6.4 SDD 微循环数量

- **风险**：8 capability × N spec → 微循环数量可能 ≥40，单 session 完成不了。
- **缓解**：tasks.md 标注每个微循环的"必须本轮 / 可推 V2 / 可推 V3"标签；至少完成所有 MUST 后才允许归档。

### 6.5 与 public-launch-polish 测试冲突

- **风险**：现有测试（如 `globals.test.ts` 第 40-53 行断言 .markdown-alert 五个 type）可能因新 token / 新结构需要更新。
- **缓解**：每条 spec 在 test-map 中明确"新建 / 修改 / 替换"现有测试；不允许"删除测试规避"。

---

## 7. 依赖与前置（Dependencies）

- ✅ 已有：unified / remark / rehype / shiki 4.x 完整管道
- ✅ 已有：Tailwind v4 @theme tokens / `.markdown-body` 阅读基底 / launch-surface primitive
- ✅ 已有：`renderMarkdown(content, options)` 函数签名稳定
- ⚠️ 本轮新增（候选）：
  - Shiki **light theme**（`min-light` 或 `github-light`，无新依赖，shiki 自带）
  - 客户端 markdown editor 替代方案（design-notes EC-D1 决策后才定）
  - 复制按钮的轻量 toast（项目已有 sonner，复用）

## 8. 时间预算（含微循环估算）

| capability | spec 数（估） | 微循环数（估） | 工作量（估） |
|---|---|---|---|
| markdown-reading | 6-8 | 12-16 | 6-8h |
| editor-source-contract | 4-6 | 8-12 | 6-10h（含选型 PoC） |
| editor-preview-parity | 3-4 | 6-8 | 3-5h |
| home-redesign | 4-6 | 8-12 | 4-6h |
| about-redesign | 3-5 | 6-10 | 3-5h |
| admin-readability | 5-7 | 10-14 | 5-7h |
| incomplete-pages-inventory | 2-3 | 4-6 | 1-2h |
| i18n-current-state-audit | 0（纯文档） | 0 | 2-3h |
| 浏览器逐页审查 + 文档收口 | — | — | 3-4h |
| **合计** | **27-39** | **54-78** | **33-50h** |

按 SDD 单微循环 ≤30 分钟工作量的硬约束，本任务规模相当于一个 7-10 个开发日的中等 feature。建议分 3 个 milestone：

- **M1**：editor 契约修复 + Markdown 阅读 token（最高 priority，是后续视觉基础）
- **M2**：admin 可读性 + 首页 + About
- **M3**：未完成页面收口 + i18n 审计文档 + 浏览器审查 + 归档

---

## 9. 不变式（Invariants）

以下规则在整个 implementation 期间不允许破坏：

1. **存储格式永远是 Markdown 字符串**——不允许把 ProseMirror JSON / Slate AST / 其它中间格式落到 `PostTranslation.content`。
2. **schema 不动**——不增删 Prisma 字段、不加 migration；i18n 等的"数据预留"保留原状。
3. **API contract 不动**——admin posts 的 POST/PATCH/DELETE 接口字段不变。
4. **SDD/TDD 节奏不破**——每条 spec 必须 RED→GREEN→commit pair；不允许声明式 RED；不允许 NO-TDD 规避（除 docs/css 类边缘 commit 显式加 `[no-tdd]`）。
5. **现有功能不退化**——typecheck / lint / 全量 test / build 四绿在每个 milestone 边界都要重跑。

---

## 10. 验收路径（Sign-off Path）

1. **每条 spec done** → 提交 test/feat commit pair → tasks.md 勾选
2. **每个 capability done** → 跑 `pnpm typecheck && pnpm lint && pnpm test` 四绿 → 在 `browser-audit-checklist.md` 完成对应路由的逐项审查 → 截图归档
3. **全部 capability done** → 跑 `pnpm build` 通过 → 写 completion-report.md → 更新 memory-bank（`activeContext` / `progress` / `knownIssues` / `systemPatterns` 同步）
4. **执行方自检过** → 提交给 ha1den 复审 → 通过后 `git mv .claude/sdd/public-ui-and-editor-overhaul .claude/sdd/archive/2026-MM-DD-public-ui-and-editor-overhaul`
5. **memory-bank 同步**：`progress.md` 把本轮成果写在"已完成"段；`knownIssues.md` 关闭已 RESOLVED 的项；`systemPatterns.md` §14 编辑器契约和 §13 Markdown pipeline 按本轮实际更新

---

## 11. 入口文档

执行方应按以下顺序阅读：

1. **`README.md`**（本目录） — 交付入口、强约束
2. **`proposal.md`**（当前文件） — 整体方案
3. **`design-research.md`** — 参考案例与设计判断
4. **`design-notes.md`** — 设计系统决策（token、组件原则、选型）
5. **`specs/<capability>/spec.md`** — 单 capability 的 GIVEN/WHEN/THEN
6. **`test-map.md`** — spec-id → 测试函数映射
7. **`tasks.md`** — TDD 微循环任务清单
8. **`incomplete-pages-inventory.md`** — 路由完成度盘点
9. **`i18n-current-state.md`** — 多语言现状审计
10. **`browser-audit-checklist.md`** — 浏览器逐页审查清单 + 缺陷模板
11. **`deferred-v2-v3.md`** — V2/V3 延后清单

未阅读完上述文档前不允许写 implementation 代码。
