# Test Map — public-ui-and-editor-overhaul

> 每条 spec-id 映射到具体测试函数、测试文件路径、测试层级（unit / component / integration / visual / docs）、runtime / 备注。
> 强约束：**无 test-map 不允许进入 implementation**（CLAUDE.md §SDD §2）。
> 微循环执行时按本表的 spec-id → test 名称写 RED 测试；GREEN 后该行打勾。

---

## 0. 测试层约定

| 层 | 工具 | 文件位置 | 何时用 |
|---|---|---|---|
| `unit` | Vitest | `src/lib/**/*.test.ts` | 纯函数 / utility |
| `component` | Vitest + jsdom + RTL | `src/components/**/*.test.tsx` | React 组件 |
| `integration` | Vitest + jsdom + RTL | `src/app/**/*.test.tsx` | page / layout / route handler |
| `visual` | Vitest + 自定义 token contrast helper | `src/app/globals.test.ts`、`src/lib/visual/*.test.ts` | token 对比度 / CSS 选择器存在性 |
| `docs` | （无自动测试） | 文档存在性 + grep 断言可写在 `scripts/check-*.ts` | 文档审计 |

> `docs` 层不强制写 Vitest 测试，但需要在执行方 implementation 末段手动 / 脚本验证文档项满足。

---

## 1. markdown-reading

| Spec-ID | Layer | File | Test Function | Notes |
|---|---|---|---|---|
| MR-1.1 | visual | `src/app/globals.test.ts` | `it("defines all callout type tokens for both modes")` | 检查 5 type × 2 mode × 2 (accent/tint) = 20 个 CSS variable 存在 |
| MR-1.2 | unit | `src/lib/markdown.test.ts` | `it("emits markdown-alert aside with title div and icon svg")` | 扩展现有 alert test (line 39-67) |
| MR-1.3 | unit | `src/lib/markdown.test.ts` | `it("inlines correct SVG path for each alert type")` | path string 断言 |
| MR-1.4 | visual | `src/app/globals.test.ts` | `it("callout accent/tint pairs meet WCAG AA contrast")` | 用 hslToRGB + luminance helper 算对比度 |
| MR-1.5 | visual | `src/app/globals.test.ts` | `it("callout has inner outline in dark mode")` | grep `.dark .markdown-alert` 含 box-shadow inset |
| MR-2.1 | unit | `src/lib/markdown.test.ts` | `it("highlighter is configured with light and dark themes")` | mock createHighlighter，断言 themes 配置 |
| MR-2.2 | unit | `src/lib/markdown.test.ts` | `it("emits dual-theme markup for code blocks")` | 输出含双主题 markup |
| MR-2.3 | visual | `src/lib/visual/code-block.test.ts`（新建） | `it("code block applies light theme tokens by default")` | 基于 CSS selector + computed style 模拟 |
| MR-2.4 | docs/manual | `package.json` 检查 | `it("does not add new shiki-related deps")` | snapshot dependencies |
| MR-3.1 | unit | `src/lib/markdown.test.ts` | `it("wraps shiki pre in code-block figure with data-language")` | DOM 断言 |
| MR-3.2 | unit | `src/lib/markdown.test.ts` | `it("emits filename span when title meta present")` | fence meta parse 测试 |
| MR-3.3 | unit | `src/lib/markdown.test.ts` | `it("emits copy button stub with data-copy attribute")` | DOM 断言 |
| MR-3.4 | component | `src/components/markdown/MarkdownCopyButtons.test.tsx`（新建） | `it("binds clipboard write and shows toast on click")` | jsdom mock clipboard |
| MR-3.5 | unit | `src/lib/markdown.test.ts` | `it("does not wrap inline code in figure")` | DOM 断言 |
| MR-3.6 | visual | `src/app/globals.test.ts` | `it("code-block-chrome has expected token usage")` | grep CSS rule |
| MR-4.1 | unit | `src/lib/markdown.test.ts` | `it("wraps tables in md-table-scroll div")` | DOM 断言 |
| MR-4.2 | visual | `src/app/globals.test.ts` | `it("table zebra and th use table tokens")` | grep CSS |
| MR-5.1 | visual | `src/app/globals.test.ts` | `it("task list checkbox uses accent color")` | grep CSS |
| MR-6.1 | visual | `src/app/globals.test.ts` | `it("kbd element uses kbd tokens with inset shadow")` | grep CSS |
| MR-7.1 | unit | `src/lib/markdown.test.ts` | `it("renders nested list with increasing indent")` | DOM depth check |
| MR-7.2 | unit | `src/lib/markdown.test.ts` | `it("renders multi-paragraph blockquote with stack spacing")` | DOM check |
| MR-7.3 | visual | `src/app/globals.test.ts` | `it("hr uses border-border token")` | grep CSS |
| MR-8.1 | unit | `src/lib/markdown.test.ts` | `it("snapshots full DOM for each callout type")` | 扩展现有 alert spec |
| MR-8.2 | unit | `src/lib/markdown.test.ts` | `it("snapshots code block chrome DOM")` | snapshot DOM |
| MR-8.3 | component | `src/components/markdown/MarkdownCopyButtons.test.tsx` | `it("invokes navigator.clipboard.writeText on click and reverts state after timeout")` | jsdom |
| MR-8.4 | visual | `src/app/globals.test.ts` | `it("globals.css contains all new tokens and selectors")` | grep 一系列 selector 字符串 |
| MR-8.5 | integration | `src/app/(site)/posts/[slug]/page.test.tsx` | `it("renders complex markdown with callouts, code, table, lists, kbd")` | 扩展现有 |
| MR-9.1 | unit | `src/lib/markdown.test.ts` | （现有 alert 测试） | 不动 |
| MR-9.2 | visual | `src/app/globals.test.ts` | （现有 5 type 断言） | 不动 |
| MR-9.3 | integration | `src/app/(site)/posts/[slug]/page.test.tsx` | （现有 .markdown-body / no-prose） | 不动 |
| MR-10.1 | unit | `src/lib/markdown.test.ts` | `it("renders large markdown within time budget")` | 用 `performance.now()` 简单基准（设宽容阈值） |
| MR-10.2 | unit | `src/lib/markdown.test.ts` | `it("reuses highlighter across calls")` | mock createHighlighter call count |

---

## 2. editor-source-contract

| Spec-ID | Layer | File | Test Function | Notes |
|---|---|---|---|---|
| EC-1.1 | component | `src/components/editor/MarkdownEditor.test.tsx`（新建） | `it("displays raw markdown text in editor surface")` | RTL 查询 cm-content 文本内容 |
| EC-1.2 | component | 同上 | `it("does not apply prose or markdown-body classes")` | DOM className 检查 |
| EC-1.3 | component | 同上 | `it("toolbar bold action wraps selection with **")` | 模拟选择 + 点击 |
| EC-2.1 | component | 同上 | `it("loads complex markdown literally into editor")` | round-trip fixture |
| EC-2.2 | component | 同上 | `it("emits loaded markdown back unchanged when nothing edited")` | onChange snapshot |
| EC-2.3 | component | 同上 | `it("re-renders editor with new value and remains literal")` | value prop change |
| EC-3.1 | component | `src/components/editor/EditorToolbar.test.tsx`（新建） | `it("renders all required toolbar buttons")` | RTL get by role/title |
| EC-3.2 | component | 同上 | `it("bold button surrounds selection")` | 模拟 |
| EC-3.3 | component | 同上 | `it("H2 button prepends ## to current line")` | 模拟 |
| EC-3.4 | component | 同上 | `it("code block button inserts triple backtick fence")` | 模拟 |
| EC-3.5 | component | 同上 | `it("callout button inserts > [!NOTE] block")` | 模拟 |
| EC-3.6 | component | 同上 | `it("link button opens dialog and wraps selection")` | 模拟 dialog + URL input |
| EC-3.7 | component | 同上 | `it("image button opens media dialog and inserts image markdown")` | 模拟 mock fetch /api/admin/media |
| EC-4.1 | component | `src/components/editor/MarkdownEditor.test.tsx` | `it("tab inserts 2 spaces")` | keydown |
| EC-4.2 | component | 同上 | `it("does not auto-rewrite markdown syntax")` | 输入 `# ` 后检查文本 |
| EC-4.3 | component | 同上 | `it("continues list with - on Enter")` | keydown |
| EC-4.4 | component | 同上 | `it("renders line numbers")` | DOM 查 cm-lineNumbers |
| EC-4.5 | component | 同上 | `it("shows placeholder when empty")` | DOM 查 placeholder |
| EC-4.6 | component | 同上 | `it("ctrl/cmd+s triggers onSave callback")` | keydown mod+s |
| EC-4.7 | component | 同上 | `it("auto-pairs brackets when typing [")` | keydown |
| EC-5.1 | manual / docs | n/a | implementation 自检 long doc perf | dev profiling，不强测 |
| EC-5.2 | manual / docs | n/a | implementation 自检 leak | devtools heap，不强测 |
| EC-5.3 | integration | `src/app/(admin)/admin/posts/new/page.test.tsx` | `it("dynamic imports editor without SSR mismatch")` | render 不抛 |
| EC-6.1 | docs/manual | `package.json` diff check | 删除 + 新增依赖列表 | grep + lockfile inspect |
| EC-6.2 | docs/manual | `pnpm build` 输出 | admin chunk gzip ≤ 90 kB | 手动看 build 输出 |
| EC-6.3 | docs/manual | grep `tiptap\|prose-neutral` in src | 无残留 | bash 命令 |
| EC-7.1 | integration | `src/components/admin/posts/PostEditor.test.tsx` | （现有 7 specs，必要时调整 mock） | 保留全部 |
| EC-7.2 | component | `MarkdownEditor.test.tsx` 一组 spec | 见 EC-1, EC-2, EC-4 各项 | 由本表统一覆盖 |
| EC-7.3 | unit | `src/lib/editor/round-trip.test.ts`（新建） | `it("round-trips fixture markdown without change")` | fixture-driven，参数化 5+ case |
| EC-7.4 | component | `EditorToolbar.test.tsx` | 见 EC-3 项 | 已覆盖 |
| EC-7.5 | integration | `PostEditor.test.tsx` | `it("submits unchanged content when no edits performed")` | 新增 1 spec |
| EC-8.1 | visual | `src/app/globals.test.ts` | `it("editor surface uses mono font and base text size")` | grep CSS |
| EC-8.2 | component | `MarkdownEditor.test.tsx` | `it("applies markdown syntax highlight without rendering")` | 检查 token class，但不全 render |
| EC-8.3 | component | 同上 | `it("editor theme toggles with html dark class")` | document.documentElement.classList |
| EC-8.4 | visual | `src/app/globals.test.ts` | `it("toolbar uses admin tokens for hover and active")` | grep |
| EC-9.1 | component | `MarkdownCopyButtons.test.tsx` | （MR-8.3 已覆盖） | 用同测试 |
| EC-9.2 | component | `MarkdownEditor.test.tsx` | `it("handles long line wrap")` | render 10k char line |
| EC-9.3 | component | 同上 | `it("paste rich text inserts as plain text")` | 模拟 paste with html mime |
| EC-9.4 | component | 同上 | `it("paste markdown inserts literally")` | 模拟 paste |
| EC-9.5 | component | 同上 | `it("ctrl+a delete triggers single onChange")` | keydown 序列 |

---

## 3. editor-preview-parity

| Spec-ID | Layer | File | Test Function | Notes |
|---|---|---|---|---|
| EP-1.1 | unit | `src/lib/markdown.test.ts` | `it("client and server renderMarkdown share same pipeline")` | 同 module import |
| EP-1.2 | unit | `src/lib/markdown.test.ts` | `it("server and client renderMarkdown produce identical HTML")` | 用 fixture |
| EP-1.3 | component | `src/components/editor/MarkdownEditorWithPreview.test.tsx`（重写） | `it("preview container uses markdown-body class")` | DOM |
| EP-1.4 | component | 同上 | `it("preview does not contain Lightweight preview footnote text")` | DOM 不含字符 |
| EP-2.1 | component | 同上 | `it("debounces preview render at 200ms")` | use fakeTimers |
| EP-2.2 | manual / docs | dev profiling | long doc perf | implementation 自检 |
| EP-2.3 | component | 同上 | `it("cancels in-flight preview on rapid input")` | mock + assert |
| EP-2.4 | docs/manual | n/a | optional web worker | 仅在 EP-2.2 不达标时启用 |
| EP-3.1 | component | `MarkdownEditorWithPreview.test.tsx` | `it("displays error banner on markdown parse failure")` | 注入 bad markdown |
| EP-3.2 | unit | `src/lib/markdown.test.ts` | `it("falls back to plain code when shiki cannot highlight language")` | unknown lang |
| EP-3.3 | unit | `src/lib/markdown.test.ts` | `it("sanitizes malicious HTML in preview")` | <script> |
| EP-4.1 | integration | `src/components/editor/preview-parity.test.tsx`（新建） | `it("preview matches published view for all callouts")` | 渲染两次比对 |
| EP-4.2 | integration | 同上 | `it("preview matches published view for code blocks with chrome")` | snapshot |
| EP-4.3 | integration | 同上 | `it("preview matches published view for tables, lists, blockquotes")` | snapshot |
| EP-4.4 | visual | `src/app/globals.test.ts` | `it("link hover style applies to .markdown-body")` | grep |
| EP-4.5 | component | `MarkdownCopyButtons.test.tsx` | `it("copy button works inside preview")` | 渲染 preview + click |
| EP-5.1 | unit | `src/lib/markdown.test.ts` | `it("renderMarkdown is isomorphic (no node-only globals)")` | dynamic import 验证 |
| EP-5.2 | docs/manual | `pnpm build` output | preview chunk dynamic-imported | 手动看 |
| EP-5.3 | component | `MarkdownCopyButtons.test.tsx` | `it("cleans up listeners on unmount")` | mount/unmount cycle |
| EP-6.1 | integration | `preview-parity.test.tsx` | `it("parity hash matches across server and client")` | sha256 |
| EP-6.2 | component | `MarkdownEditorWithPreview.test.tsx` | `it("preview DOM updates after debounce")` | timer advance |
| EP-6.3 | component | 同上 | `it("error banner is role alert")` | aria role 断言 |
| EP-6.4 | manual / docs | dev profiling | render time budget | implementation 自检 |
| EP-7.1 | component | `src/components/editor/MarkdownPreview.test.tsx` | （现有断言） | 保留 |
| EP-7.2 | docs/manual | grep miniRenderMarkdown | 删除后无残留 | bash |

---

## 4. home-redesign

| Spec-ID | Layer | File | Test Function | Notes |
|---|---|---|---|---|
| H-1.1 | integration | `src/app/(site)/page.test.tsx` | `it("renders 7 sections in order")` | compareDocumentPosition |
| H-1.2 | integration | 同上 | `it("does not import LaunchNarrative on home page")` | grep import or DOM 不含 |
| H-2.1 | component | `src/components/site/HomeHero.test.tsx`（新建） | `it("renders eyebrow, title, lede, dual CTA, now")` | DOM |
| H-2.2 | visual | `src/app/globals.test.ts` | `it("hero applies launch-surface, dot-grid, grain overlay")` | grep CSS |
| H-2.3 | component | `HomeHero.test.tsx` | `it("applies reveal animation classes on mount")` | data-reveal attr |
| H-2.4 | visual | `globals.test.ts` | `it("hero dot-grid token differs in dark mode")` | grep `.dark .hero-dot-grid` |
| H-3.1 | component | `src/components/site/HomeFeaturedAndRecent.test.tsx`（新建） | `it("renders one featured large card and 5-8 recent rows")` | mock listPosts |
| H-3.2 | component | 同上 | `it("renders empty state when no published posts")` | mock []  |
| H-3.3 | component | 同上 | `it("queries only PUBLISHED posts")` | spy listPosts arg |
| H-4.1 | component | `src/components/site/HomeColumns.test.tsx`（新建） | `it("renders up to 6 column cards with launch-panel")` | mock listColumns |
| H-4.2 | component | 同上 | `it("excludes columns with zero posts")` | mock fixture |
| H-4.3 | component | 同上 | `it("renders heading and 全部 link")` | DOM |
| H-5.1 | component | `src/components/site/HomePrinciples.test.tsx`（新建） | `it("renders 4 principle cards with mono numbers")` | DOM |
| H-5.2 | unit | `src/lib/content/principles.test.ts`（新建） | `it("HomePrinciples set is a subset of AboutPrinciples")` | data-driven |
| H-6.1 | component | `src/components/site/TechStack.test.tsx`（新建或扩展） | `it("renders heading and 5 categories")` | DOM |
| H-6.2 | component | 同上 | `it("each item shows hover tooltip with rationale")` | DOM attr |
| H-6.3 | component | 同上 | `it("links to /about#tech-stack")` | DOM |
| H-7.1 | component | `src/components/site/GithubCard.test.tsx`（扩展） | `it("uses launch-panel container")` | DOM |
| H-7.2 | component | 同上 | `it("renders Chinese fallback when API unavailable")` | error mode |
| H-8.1 | component | `src/components/site/HomeStats.test.tsx`（新建） | `it("renders mono single-line stats above footer")` | DOM + CSS class |
| H-8.2 | unit | `src/lib/services/stats.test.ts`（如有/新建） | `it("returns last-shipped date when posts exist")` | service test |
| H-9.1 | integration | `src/app/(site)/page.test.tsx` | `it("does not show English chrome text alongside Chinese")` | grep DOM |
| H-9.2 | integration | 同上 | `it("renders unified Chinese chrome labels")` | text content |
| H-10.1 | manual / docs | dev | TTFB measurement | 手动 / Lighthouse |
| H-10.2 | manual / docs | dev | CLS/LCP measurement | 手动 |
| H-11.1 | integration | `src/app/(site)/page.test.tsx` | （扩展现有 8 specs） | 8 spec → ~15 spec |
| H-11.2 | component | 各子组件 .test.tsx | 见上各 spec |  |
| H-11.3 | integration | `src/app/(site)/page.test.tsx` | async RSC stub | 按 systemPatterns §18 |

---

## 5. about-redesign

| Spec-ID | Layer | File | Test Function | Notes |
|---|---|---|---|---|
| A-1.1 | integration | `src/app/(site)/about/page.test.tsx` | `it("renders 8 sections in order")` | compareDocumentPosition |
| A-1.2 | integration | 同上 | `it("retains existing AboutHero/Now/Principles/Contact components")` | DOM 查 component testid |
| A-2.1 | component | `src/components/site/about/AboutHero.test.tsx`（扩展） | `it("renders eyebrow, h1, lede, now status")` | DOM |
| A-2.2 | visual | `globals.test.ts` | `it("AboutHero uses same launch-surface but reduced strength")` | grep |
| A-3.1 | component | `src/components/site/about/AboutNow.test.tsx`（扩展） | `it("renders 4 columns: Shipping/Writing/Reading/Hardening")` | DOM |
| A-3.2 | unit | `src/lib/content/about.test.ts`（如有/新建） | `it("about content data has reading column")` | data shape |
| A-4.1 | component | `src/components/site/about/AboutProjectIntent.test.tsx`（新建） | `it("renders Why exists / Who for / What it isn't sections")` | DOM |
| A-4.2 | component | 同上 | `it("contains 3+ concrete facts")` | grep numeric / specific keywords |
| A-5.1 | component | `src/components/site/about/AboutTechStack.test.tsx`（新建） | `it("renders all 5 categories with rationale per item")` | mock content/tech-stack |
| A-5.2 | component | 同上 | `it("section has id=tech-stack for hash anchor")` | DOM id |
| A-5.3 | unit | `src/lib/content/tech-stack.test.ts`（新建） | `it("tech stack data has rationale string per item")` | shape check |
| A-6.1 | component | `src/components/site/about/AboutImplementationApproach.test.tsx`（新建） | `it("renders 4 methodology entries")` | DOM |
| A-6.2 | component | 同上 | `it("methodology entries render code snippet visually")` | DOM contains pre |
| A-7.1 | component | `src/components/site/about/AboutPrinciples.test.tsx`（扩展） | `it("renders 6-8 principle cards")` | DOM count |
| A-7.2 | unit | `src/lib/content/principles.test.ts` | （A-7.2 = H-5.2 same fixture） | shared |
| A-8.1 | component | `src/components/site/about/AboutFutureRoadmap.test.tsx`（新建） | `it("renders current/V2/V3 columns with i18n disclosure")` | DOM + text |
| A-8.2 | component | 同上 | `it("contains '中文单语言' explicit text")` | text content |
| A-9.1 | component | `src/components/site/about/AboutContact.test.tsx`（扩展） | `it("renders email and social links")` | DOM |
| A-10.1 | visual | `globals.test.ts` | `it("About sections reuse launch-panel CSS")` | grep |
| A-10.2 | visual | `globals.test.ts` | `it("about typography tokens match home")` | grep |
| A-10.3 | manual / docs | browser audit | dark mode pass | checklist |
| A-11.1 | unit | `tech-stack.test.ts` + `about.test.ts` | `it("content is sole source of truth, components import from there")` | grep |
| A-11.2 | unit | 同上 | `it("content has TypeScript interfaces")` | type check |
| A-12.1 | integration | `about/page.test.tsx` | 多个 spec | 8 sections + facts + i18n disclosure |
| A-12.2 | component | 各 about/* .test.tsx | 见上各 spec |  |
| A-12.3 | integration | `about/page.test.tsx` | `it("contains i18n disclosure keywords")` | text content |

---

## 6. admin-readability

| Spec-ID | Layer | File | Test Function | Notes |
|---|---|---|---|---|
| AR-1.1 | integration | `src/app/(admin)/admin/layout.test.tsx`（扩展） | `it("AdminLayout renders AdminSidebar component")` | DOM |
| AR-1.2 | component | `src/components/admin/AdminSidebar.test.tsx`（扩展） | `it("NAV_ITEMS has 5 entries without analytics or settings")` | data |
| AR-1.3 | component | 同上 | `it("all sidebar hrefs map to existing page files")` | fs.existsSync 在 test setup |
| AR-2.1 | component | 同上 | `it("active item has data-active and indicator class")` | DOM with mocked usePathname |
| AR-2.2 | component | 同上 | `it("startsWith matching for nested routes")` | usePathname returns /admin/posts/new |
| AR-2.3 | component | 同上 | `it("inactive items have data-active=false")` |  |
| AR-3.1 | visual | `globals.test.ts` | `it("light mode muted-fg token meets 5.5:1 on bg")` | contrast helper |
| AR-3.2 | visual | 同上 | `it("dark mode muted-fg token meets 5.0:1 on bg")` |  |
| AR-3.3 | docs/manual | grep usages | sweep no regression | implementation 自检 |
| AR-3.4 | visual | `globals.test.ts` | `it("all defined contrast assertions pass")` | param suite |
| AR-4.1 | visual | `globals.test.ts` | `it("button class hierarchy unified")` | grep |
| AR-4.2 | component | `src/components/admin/posts/PostsTable.test.tsx`（扩展） | `it("delete row action uses destructive style")` | DOM class |
| AR-4.3 | component | 各 form .test | `it("form helper uses muted-fg, error uses destructive")` | snapshot |
| AR-4.4 | visual | `globals.test.ts` | `it("focus-visible uses ring token")` | grep |
| AR-5.1 | visual | `globals.test.ts` | `it("status badge tokens defined for both modes")` | grep |
| AR-5.2 | visual | 同上 | `it("status badge pairs meet AA contrast")` | contrast helper |
| AR-5.3 | component | `src/components/admin/comments/CommentsTable.test.tsx` | `it("comment badge does not use hardcoded color classes")` | grep DOM class |
| AR-6.1 | visual | `globals.test.ts` | `it("admin-table zebra and hover defined")` | grep |
| AR-6.2 | visual | 同上 | `it("admin-table th uses mono uppercase tokens")` | grep |
| AR-6.3 | component | `src/components/admin/**/Table.test.tsx` | `it("table wrapped in rounded card")` | DOM |
| AR-6.4 | component | `PostsFilters.test.tsx` | `it("Reset button appears when filters active")` | RTL |
| AR-7.1 | component | `AdminHeader.test.tsx`（新建） | `it("renders breadcrumb when path is multi-segment")` | optional |
| AR-7.2 | component | 同上 | `it("user menu is a dropdown trigger")` | DOM |
| AR-8.1 | component | `src/components/admin/EmptyState.test.tsx`（新建） | `it("renders title/description/action props")` | DOM |
| AR-8.2 | component | 各 list page .test | `it("uses EmptyState component with Chinese copy")` | DOM check |
| AR-9.1 | manual / docs | browser audit | dark mode sweep | checklist |
| AR-10.1 | integration | `admin/layout.test.tsx` | （上面 AR-1, AR-2 已覆盖） |  |
| AR-10.2 | visual | `globals.test.ts` | （AR-3.4 + AR-5.2 已覆盖） |  |
| AR-10.3 | component | `EmptyState.test.tsx` | （AR-8.1 已覆盖） |  |
| AR-10.4 | integration / component | 现有 admin test files | 不退化 | 全量 pass |

---

## 7. incomplete-pages-inventory

| Spec-ID | Layer | File | Test Function | Notes |
|---|---|---|---|---|
| IP-1.1 | docs/manual | `incomplete-pages-inventory.md` 存在 | 文档检查 | 自检 |
| IP-1.2 | docs/manual | grep `find src/app -name "page.tsx"` | 对比文档表格 | 实施末段手动 |
| IP-2.1 | component | `AdminSidebar.test.tsx` | `it("does not link to /admin/analytics or /admin/settings")` | DOM grep |
| IP-2.2 | docs/manual | bash sweep | no dead links | 实施末段手动 |
| IP-2.3 | docs/optional | `scripts/check-internal-links.ts` | 可选脚本 | 不强 |
| IP-3.1 | docs/manual | `_editor-demo` 路由存在 + 不在 sidebar | 自检 |  |
| IP-3.2 | docs/manual | `_editor-demo` page 内有 PoC banner | 自检 |  |
| IP-4.1 | docs/manual | 实施过程纪律 | 自检 |  |
| IP-5.1 | component | `AdminSidebar.test.tsx` + `SiteHeader.test.tsx` | nav href existence | fs.existsSync helper |
| IP-5.2 | component | `AdminSidebar.test.tsx` | `it("NAV_ITEMS excludes analytics/settings keywords")` | data check |

---

## 8. i18n-current-state-audit

| Spec-ID | Layer | File | Test Function | Notes |
|---|---|---|---|---|
| I18N-1.1 | docs/manual | `i18n-current-state.md` 存在 + 章节齐全 | 自检 |  |
| I18N-1.2 | docs/manual | grep i18n call sites line-by-line | 自检 + 文档同步 |  |
| I18N-2.1 | component | `AboutFutureRoadmap.test.tsx` | `it("renders i18n disclosure with 中文单语言 / V3 keywords")` | text |
| I18N-2.2 | docs/manual | README grep | 包含 single-locale | 自检 |
| I18N-2.3 | docs/manual | `sitemap.ts` 顶部注释 + `robots.ts` 注释 | grep | 自检 |
| I18N-3.1 | component | `SiteHeader.test.tsx` + footer .test | `it("no language switcher UI")` | DOM 不存在 select / 链接 |
| I18N-3.2 | integration | `posts/[slug]/page.test.tsx` | `it("metadata.alternates.languages is not set")` | metadata snapshot |
| I18N-3.3 | docs/manual | grep next-intl / dictionary in src | 无匹配 | 自检 |
| I18N-4.1 | docs/manual | `i18n-current-state.md §12` 完整性 | 自检 |  |
| I18N-4.2 | docs/manual | `memory-bank/progress.md` V3 backlog 更新 | 自检 |  |
| I18N-5.1 | integration | `(site)/page.test.tsx` | `it("does not mix Chinese and English chrome on home")` | text scan |
| I18N-5.2 | component | admin 各 .test | `it("button labels are Chinese")` | grep |
| I18N-5.3 | component | `SiteHeader.test.tsx` | `it("nav labels are Chinese 文章 专栏 关于")` | text |
| I18N-6.1 | docs/optional | `scripts/check-i18n-disclosure.ts` | 可选 | 不强 |
| I18N-6.2 | component | `SiteHeader.test.tsx` | （I18N-5.3 已覆盖） |  |
| I18N-6.3 | integration | metadata 测试 | （I18N-3.2 已覆盖） |  |

---

## 9. Spec → test 数量统计

| Capability | spec 数 | 自动测试 spec 数 | docs/manual spec 数 |
|---|---|---|---|
| markdown-reading | 28 | 23 | 5 |
| editor-source-contract | 33 | 25 | 8 |
| editor-preview-parity | 17 | 14 | 3 |
| home-redesign | 26 | 22 | 4 |
| about-redesign | 22 | 20 | 2 |
| admin-readability | 27 | 23 | 4 |
| incomplete-pages-inventory | 9 | 4 | 5 |
| i18n-current-state-audit | 14 | 6 | 8 |
| **合计** | **176** | **137** | **39** |

> 自动测试 spec 比例 ~78%。docs/manual spec 主要是文档存在、grep 检查、浏览器审查。

---

## 10. 已有测试文件清单（应当被扩展，不允许重复创建）

- `src/lib/markdown.test.ts`
- `src/app/globals.test.ts`
- `src/app/sitemap.test.ts`
- `src/app/(site)/page.test.tsx`
- `src/app/(site)/about/page.test.tsx`
- `src/app/(site)/posts/[slug]/page.test.tsx`
- `src/app/(site)/posts/[slug]/opengraph-image.test.ts`
- `src/app/(site)/tags/page.test.tsx`
- `src/app/(site)/tags/[slug]/page.test.tsx`
- `src/components/editor/MarkdownPreview.test.tsx`
- `src/components/admin/posts/PostEditor.test.tsx`
- `src/components/admin/posts/PostsTable.test.tsx`
- `src/components/admin/posts/PostsFilters.test.tsx`
- `src/components/admin/columns/ColumnsTable.test.tsx`
- `src/components/admin/comments/CommentsTable.test.tsx`
- `src/components/admin/MetricCard.test.tsx`
- `src/components/admin/TrendChart.test.tsx`
- `src/components/admin/MediaUploadDropzone.test.tsx`
- `src/app/(admin)/admin/layout.test.tsx`（如不存在则创建）

## 11. 新建测试文件清单

- `src/components/editor/MarkdownEditor.test.tsx`
- `src/components/editor/EditorToolbar.test.tsx`
- `src/components/editor/MarkdownEditorWithPreview.test.tsx`（重写）
- `src/components/editor/preview-parity.test.tsx`
- `src/components/markdown/MarkdownCopyButtons.test.tsx`
- `src/lib/editor/round-trip.test.ts`
- `src/lib/visual/code-block.test.ts`
- `src/lib/content/principles.test.ts`
- `src/lib/content/tech-stack.test.ts`
- `src/lib/content/about.test.ts`（如不存在）
- `src/components/site/HomeHero.test.tsx`
- `src/components/site/HomeFeaturedAndRecent.test.tsx`
- `src/components/site/HomeColumns.test.tsx`
- `src/components/site/HomePrinciples.test.tsx`
- `src/components/site/HomeStats.test.tsx`
- `src/components/site/about/AboutProjectIntent.test.tsx`
- `src/components/site/about/AboutTechStack.test.tsx`
- `src/components/site/about/AboutImplementationApproach.test.tsx`
- `src/components/site/about/AboutFutureRoadmap.test.tsx`
- `src/components/admin/EmptyState.test.tsx`
- （可选）`src/components/admin/AdminHeader.test.tsx`
- `src/components/site/TechStack.test.tsx`（如不存在）
- `src/components/site/GithubCard.test.tsx`（如不存在）

每个新文件第一条 spec 是 [TEST-RED]：写一个最小失败用例验证组件能 mount + render 关键元素。

---

## 12. test fixture 文件

实施时需建立 markdown fixture：

- `src/lib/markdown/__fixtures__/full-syntax.md` — 含 callout 五分类、code block 多语言、table、nested list、blockquote、kbd、task list、footnote、HTML inline，用于 parity 与 round-trip 测试。
- `src/lib/markdown/__fixtures__/edge-cases.md` — 边缘 case（极长行、特殊 unicode、空 fence、未闭合 fence）。

fixture 文件不会被 next 编译；用 `fs.readFileSync` 在测试中加载。
