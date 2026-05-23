# Spec — markdown-reading

> Capability：Markdown 阅读体验重做。
> 范围：服务端 `renderMarkdown` 管道、`.markdown-body` 样式、callout 体系、code block chrome、token 系统。
> 上游：`design-notes.md §2-§3`、`design-research.md §1-§3`。
> 不动：编辑器源码契约（spec EC-*）、预览管道（spec EP-*）；本 spec 只关心**发布态阅读**。

---

## MR-1 callout token 体系扩展

### MR-1.1 callout 五分类全 token 化

**GIVEN** `src/app/globals.css` 当前 callout 颜色硬编码在 `.markdown-alert-{type}` 选择器中（line 481-504）
**WHEN** 把 callout 颜色统一抽到 `:root` / `.dark` 的 `--callout-{type}-{accent|tint}` token
**THEN** `.markdown-alert-note/.markdown-alert-tip/.markdown-alert-important/.markdown-alert-warning/.markdown-alert-caution` 五个变体都通过 `var(--callout-{type}-accent)` 与 `var(--callout-{type}-tint)` 取色；CSS 中没有任何 callout 类型仍然硬编码 `hsl(220 70% 55%)` 等具体数值；token 在 light 和 dark 两套 selector 下都定义（值参考 design-notes §2.1）。

### MR-1.2 callout 视觉规格

**GIVEN** 一条 markdown `> [!WARNING]\n正文`
**WHEN** 服务端 `renderMarkdown` 处理并渲染到详情页
**THEN** 输出 DOM 为 `<aside class="markdown-alert markdown-alert-warning" data-alert-type="warning" role="note">`，内部第一个子元素是 `<div class="markdown-alert-title">` 包含 `<svg class="markdown-alert-icon" aria-hidden="true">` 和 `<span class="markdown-alert-label">Warning</span>`；后续为渲染的 `<p>`。Title 行 `display: flex; align-items: center; gap: var(--space-inline);` 且 label 字体使用 `var(--font-mono)` 大写 letter-spacing `var(--tracking-label)`。

### MR-1.3 callout 五类 icon 内联 SVG

**GIVEN** 没有 lucide-react 等 icon 包依赖
**WHEN** `rehypeMarkdownAlerts` visitor 处理每种 callout type
**THEN** 输出 `<svg>` 的 `viewBox="0 0 24 24"` 且 path 硬编码对应类型（NOTE=info、TIP=lightbulb、IMPORTANT=alert-circle、WARNING=alert-triangle、CAUTION=octagon-x），不引入新依赖；SVG 大小 `width: 1.1em; height: 1.1em;`；颜色继承 callout-accent。

### MR-1.4 callout light/dark 对比度

**GIVEN** 任一 callout type 在 light 或 dark mode 下
**WHEN** 测试取出 token 值计算前景（accent）与背景（tint）对比度
**THEN** 每对 (accent, tint) 在 light 和 dark mode 下对比度 ≥ 4.5:1（WCAG AA）；title-label 文字（accent on tint）也 ≥ 4.5:1。

### MR-1.5 callout 在 dark mode 边界清晰

**GIVEN** dark mode 启用（`<html class="dark">`）
**WHEN** 渲染 NOTE callout
**THEN** callout 容器有 `box-shadow: inset 0 0 0 1px hsl(var(--alert-accent) / 0.25)` 或等效 inner outline，让边界在深色背景上可识别；视觉测试断言 `getComputedStyle(callout).boxShadow !== "none"`。

---

## MR-2 code block 双主题（light + dark）

### MR-2.1 Shiki themes 配置切换

**GIVEN** 当前 `src/lib/markdown.ts:52` 硬编码 `theme: "github-dark-default"`
**WHEN** 把 highlighter 改成 `themes: { light: "github-light", dark: "github-dark-default" }`
**THEN** highlighter 加载两个主题；no new dependency；`getOrCreateHighlighter` 接收 `themes` 参数；`codeToHast` 调用使用 multi-theme API。

### MR-2.2 light/dark 双主题输出

**GIVEN** 一段 ` ```ts const x = 1; ``` ` markdown
**WHEN** 服务端渲染
**THEN** 输出 `<pre class="shiki ...">` 包含 CSS 变量样式（如 `--shiki-light: #...; --shiki-dark: #...;`）或者按 shiki dual-theme 文档输出两个 span（具体策略由 implementation 决定，但需要在 light 和 dark mode 下都自动切换颜色）；DOM **不**重复包两个 `<pre>`（避免 layout shift）。

### MR-2.3 light mode 实测颜色切换

**GIVEN** dark class 切换
**WHEN** 浏览器在 light mode 加载详情页有 code block
**THEN** code block 背景色取自 light 主题 token（例如 `#f6f8fa` 或等效），前景色为深色；切换到 dark mode 后立即变为 dark 主题色（无 reload）。

### MR-2.4 不引入新依赖

**GIVEN** 当前 `package.json` 已有 `shiki@4.0.2`
**WHEN** 实施 MR-2
**THEN** `package.json` diff 中没有新增 shiki 相关依赖；highlighter 加载语言列表与现状一致或微调（不允许加大量罕见语言）。

---

## MR-3 code block chrome bar

### MR-3.1 语言徽章

**GIVEN** ` ```ts const x = 1; ``` ` markdown
**WHEN** 渲染
**THEN** 输出包含 `<figure class="code-block" data-language="ts">` 包围 `<pre>`；figure 内有 `<figcaption class="code-block-chrome">` 包含 `<span class="code-block-language">TS</span>`（大写）。

### MR-3.2 文件名（可选）

**GIVEN** ` ```ts title="src/foo.ts" const x = 1; ``` ` markdown
**WHEN** 渲染
**THEN** chrome bar 包含 `<span class="code-block-filename">src/foo.ts</span>`；如果 fence 不带 `title="..."`，chrome bar 不显示 filename span（DOM 没有空 span）。

### MR-3.3 复制按钮 DOM

**GIVEN** 任一 code block
**WHEN** 渲染
**THEN** chrome bar 末尾有 `<button class="code-block-copy" data-copy aria-label="复制代码">...</button>`；按钮内含 SVG copy icon（内联）；初始状态 `data-state="idle"`。

### MR-3.4 复制按钮交互

**GIVEN** 详情页客户端 hydration 完成
**WHEN** 用户点击复制按钮
**THEN** 客户端组件 `MarkdownCopyButtons` 调用 `navigator.clipboard.writeText(codeText)`；成功后按钮变为 `data-state="copied"` 1.5s（视觉变成 "Copied"）；失败用 sonner toast 显示错误（不允许 silent failure）。

### MR-3.5 chrome 隐藏在 inline code

**GIVEN** ` This is `inline code` in a sentence. ` markdown
**WHEN** 渲染
**THEN** inline `<code>` 不被 figure 包裹；chrome bar 不出现；inline code 样式按 design-notes §3.3。

### MR-3.6 chrome bar 视觉规格

**GIVEN** code block chrome
**WHEN** CSS 渲染
**THEN** chrome bar `background: hsl(var(--code-chrome-bg)); color: hsl(var(--code-chrome-fg)); padding: 0.4rem 0.75rem; border-bottom: 1px solid hsl(var(--code-border));` 等效；语言徽章用 mono small uppercase。

---

## MR-4 table responsive + 视觉

### MR-4.1 横向滚动 wrapper

**GIVEN** markdown table（`| a | b |` 多列）
**WHEN** 渲染
**THEN** `<table>` 被包在 `<div class="md-table-scroll">` 中；CSS `overflow-x: auto` + 可选 fade-edge 阴影提示有横向内容。

### MR-4.2 zebra + th 视觉

**GIVEN** table 渲染
**WHEN** CSS 应用
**THEN** `tbody tr:nth-child(odd)` 背景 `hsl(var(--table-row-zebra))`；`th` 背景 `hsl(var(--table-th-bg))`、字体 mono uppercase letter-spacing tracking-label、对齐 left。

---

## MR-5 task list 视觉化

### MR-5.1 disabled checkbox 样式

**GIVEN** markdown `- [ ] todo` 和 `- [x] done`
**WHEN** `remark-gfm` 输出 `<li><input type="checkbox" disabled>` 后渲染
**THEN** CSS 给 `.markdown-body li input[type="checkbox"]` 加 `accent-color: hsl(var(--accent))`、对齐 baseline、移除原生 margin；已勾选用 accent 填充；未勾选保留 border。

---

## MR-6 kbd 元素覆盖

### MR-6.1 kbd 视觉

**GIVEN** HTML inline `<kbd>⌘</kbd>` 出现在 markdown
**WHEN** 渲染
**THEN** `.markdown-body kbd` 应用 `background: hsl(var(--kbd-bg)); color: hsl(var(--kbd-fg)); border: 1px solid hsl(var(--border)); box-shadow: var(--shadow-inset-thin); border-radius: var(--radius-sm); padding: 0.1em 0.4em; font-family: var(--font-mono); font-size: 0.85em;`。

---

## MR-7 nested list / blockquote / hr 边界

### MR-7.1 nested list 缩进梯度

**GIVEN** markdown 含 nested `- item\n  - nested item\n    - deeper`
**WHEN** 渲染
**THEN** 二层 / 三层 nested list 缩进有视觉区分；CSS 直接基于 `padding-left` 或 list-style 控制；至少 2 层视觉断言（DOM 检查 `<ul><li><ul>...` 结构 + 计算 padding）。

### MR-7.2 blockquote 多段

**GIVEN** markdown `> 第一段\n>\n> 第二段` 多段 blockquote
**WHEN** 渲染
**THEN** 两个段落在同一 blockquote 内，段落间有 `var(--space-block)` 间距；blockquote 内部 paragraphs 字体保留 italic serif、color muted-fg。

### MR-7.3 hr 视觉

**GIVEN** markdown `---`
**WHEN** 渲染
**THEN** `<hr>` 渲染为 `border-top: 1px solid hsl(var(--border)); margin: var(--space-block-loose) 0;`。

---

## MR-8 测试覆盖与视觉断言

### MR-8.1 callout 五分类 DOM + token 断言

**GIVEN** `src/lib/markdown.test.ts` 现有 alert 测试（line 39-67）
**WHEN** 本 spec 实施
**THEN** 测试扩展：每个 type 断言 DOM 结构（aside + role + class + title div + label span + icon svg + p 正文）；断言 visitor 输出的 SVG path 与设计文档一致；MR-1.4 对比度通过 token 比对计算（不需要真实浏览器，但需要 token 值已知）。

### MR-8.2 code block chrome 断言

**GIVEN** code block with title
**WHEN** 测试
**THEN** 断言 DOM：figure[data-language="ts"] > figcaption.code-block-chrome > {span.code-block-language="TS", span.code-block-filename="src/foo.ts", button.code-block-copy[data-copy][aria-label]}；断言 `<pre>` 在 figure 内；inline code 时无 figure。

### MR-8.3 复制按钮客户端测试

**GIVEN** `MarkdownCopyButtons` 客户端组件
**WHEN** jsdom 测试
**THEN** 测试 mock `navigator.clipboard.writeText`，断言点击后调用、状态变化、toast 显示；测试错误路径（clipboard 拒绝）确实显示 toast.error。

### MR-8.4 .markdown-body 覆盖率断言

**GIVEN** `src/app/globals.test.ts` 现有 CSS 包含断言
**WHEN** 本 spec 实施
**THEN** 测试断言 globals.css 包含所有新加的 token (`--callout-*`、`--code-*`、`--kbd-*`、`--table-*`、`--surface-subtle` 等)；断言 `.markdown-body table`、`.markdown-body kbd`、`.markdown-body li input[type="checkbox"]`、`.code-block`、`.code-block-chrome`、`.md-table-scroll` 类选择器都出现在 CSS 中。

### MR-8.5 详情页快照（结构）

**GIVEN** 一篇含 callout + code block + table + list + blockquote + kbd 的测试 markdown
**WHEN** `renderMarkdown(content)` 调用 + 详情页渲染（async RSC stub 按 systemPatterns §18 处理）
**THEN** 渲染结果 DOM 含上述所有结构；无 `prose` class 出现；无 `<style>` inline 出现（除 shiki 必要的）。

---

## MR-9 现有测试不退化

### MR-9.1 现有 alert 测试通过

**GIVEN** `src/lib/markdown.test.ts:39-67` 现有断言（5 个 type 都被 visitor 识别 + class 名 + data-alert-type）
**WHEN** 实施完本 spec 后
**THEN** 现有测试仍然通过（可能因 DOM 结构升级需调整 expectation，但断言**强度不下降**）。

### MR-9.2 现有 globals.css 测试通过

**GIVEN** `src/app/globals.test.ts:40-53` 断言 5 个 alert class 名
**WHEN** 实施完本 spec 后
**THEN** 现有断言通过 + 新断言加入。

### MR-9.3 详情页 markdown-body 测试通过

**GIVEN** `src/app/(site)/posts/[slug]/page.test.tsx:146-159` 断言 markdown-body 存在 + 无 prose
**WHEN** 本 spec 实施
**THEN** 测试通过。

---

## MR-10 性能不退化

### MR-10.1 服务端渲染时间预算

**GIVEN** 一篇 800 词 / 含 5 个 code block / 含 3 个 callout / 含 1 个 table 的 markdown
**WHEN** 服务端 `renderMarkdown` 调用
**THEN** 处理时间 ≤ 当前基线 +30%（基线由 implementation 时实测；不允许 +100%）。

### MR-10.2 Shiki highlighter 复用

**GIVEN** 多次 `renderMarkdown` 调用
**WHEN** 实施 MR-2 双主题后
**THEN** highlighter 在进程内复用（不是每次 createHighlighter）；通过现有 `getOrCreateHighlighter` 模式保留。
