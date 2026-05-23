# Design Notes — public-ui-and-editor-overhaul

> 把 `design-research.md` 的结论锁定成可执行的 design decisions、token 命名、组件原则、依赖选型。
> 本文是执行方在写 spec / 写代码时的**强约束**。如果某项与 spec 冲突，spec 必须先回来更新本文。

---

## 1. 设计原则（凌驾于所有 spec 之上）

| 原则 | 含义 | 反例 |
|---|---|---|
| **Editorial-first** | 内容是主角，UI 是骨架；不为了"看起来现代"加视觉 | 全屏 hero video、SVG blob、cursor follow |
| **Type-and-rhythm-led** | 排版（字号 / 行高 / 间距）做主要表达，颜色辅助 | 用大量调色板色块掩盖排版缺陷 |
| **Token over hex** | 所有颜色 / 字号 / 间距通过 CSS 变量；零硬编码 | `text-[#1e293b]` `text-blue-500` |
| **Both modes first-class** | light 和 dark 都视觉过审；不只在 dark 看一眼 | "dark mode 看起来差不多就行" |
| **Accessibility as baseline** | 对比度 ≥ 4.5（正文 7+）、键盘可达、reduced-motion 尊重 | 4.6:1 边界 AA、hover-only 交互 |
| **No silent failure** | 渲染 / 复制 / 上传 错误必须可见，不允许 catch + 吞 | `try{} catch{ /* ignore */ }` |
| **Server-side wins** | 能服务端就服务端；客户端只做交互 | 把 markdown 渲染移到客户端只为"实时" |
| **Add tokens, don't add deps** | 新增三方依赖必须在本文有决策记录 | 一时兴起 `pnpm add framer-motion` |

---

## 2. Token 系统（强制更新）

### 2.1 颜色 token 调整

`src/app/globals.css` `@theme` 块 + `:root` / `.dark`。

**新增 token**（light + dark 都要写）：

```css
/* :root (light) */
--muted-fg: 220 13% 36%;                  /* was 220 9% 46% — 提对比 */
--muted-fg-strong: 220 15% 24%;           /* 用于副标题 / 次要 label */
--surface-subtle: 220 14% 98%;            /* 用于 zebra / nested surface */
--surface-raised: 0 0% 100%;              /* alias for card */
--ring-soft: 220 70% 75%;                 /* focus ring soft variant */

/* sidebar tokens */
--sidebar-fg: 220 13% 36%;
--sidebar-fg-hover: 222 47% 11%;
--sidebar-bg-hover: 220 14% 96%;
--sidebar-bg-active: 220 14% 94%;
--sidebar-indicator-active: 220 70% 55%;

/* callout tokens (light) */
--callout-note-accent: 220 70% 55%;
--callout-note-tint: 220 80% 96%;
--callout-tip-accent: 155 58% 36%;
--callout-tip-tint: 155 60% 95%;
--callout-important-accent: 270 65% 55%;  /* purple — 与 GitHub Primer 对齐 */
--callout-important-tint: 270 70% 96%;
--callout-warning-accent: 38 92% 42%;
--callout-warning-tint: 38 92% 94%;
--callout-caution-accent: 0 72% 50%;
--callout-caution-tint: 0 72% 96%;

/* code block tokens */
--code-surface: 220 14% 98%;
--code-border: 220 13% 91%;
--code-chrome-bg: 220 14% 96%;
--code-chrome-fg: 220 13% 36%;
--code-inline-bg: 220 14% 96%;
--code-inline-fg: 220 30% 18%;

/* table tokens */
--table-th-bg: 220 14% 96%;
--table-row-zebra: 220 14% 98%;
--table-row-hover: 220 14% 95%;

/* kbd tokens */
--kbd-bg: 0 0% 100%;
--kbd-fg: 222 47% 11%;
--kbd-shadow-inset: 220 13% 91%;
```

**dark mode 对偶（`.dark`）**：

```css
--muted-fg: 240 5% 70%;                   /* 微调到 6.0:1 */
--muted-fg-strong: 210 20% 90%;
--surface-subtle: 240 8% 8%;
--surface-raised: 240 10% 6%;

--sidebar-fg: 240 5% 70%;
--sidebar-fg-hover: 210 20% 98%;
--sidebar-bg-hover: 240 8% 10%;
--sidebar-bg-active: 240 8% 12%;
--sidebar-indicator-active: 220 70% 65%;

--callout-note-accent: 220 75% 65%;
--callout-note-tint: 220 50% 14%;
--callout-tip-accent: 155 50% 50%;
--callout-tip-tint: 155 40% 12%;
--callout-important-accent: 270 65% 70%;
--callout-important-tint: 270 40% 14%;
--callout-warning-accent: 38 92% 60%;
--callout-warning-tint: 38 50% 14%;
--callout-caution-accent: 0 75% 65%;
--callout-caution-tint: 0 50% 14%;

--code-surface: 240 10% 7%;
--code-border: 240 10% 14%;
--code-chrome-bg: 240 10% 10%;
--code-chrome-fg: 240 5% 70%;
--code-inline-bg: 240 10% 12%;
--code-inline-fg: 210 20% 90%;

--table-th-bg: 240 10% 10%;
--table-row-zebra: 240 8% 8%;
--table-row-hover: 240 8% 12%;

--kbd-bg: 240 10% 12%;
--kbd-fg: 210 20% 90%;
--kbd-shadow-inset: 240 10% 18%;
```

> 上述 token 值是**起点**而不是终点。执行方在 spec MR-1 / AR-1 实施时应用浏览器 devtools / Lighthouse 实测对比度，按需微调。微调超出 ±5% L 值时需要在 design-notes 末尾的 "调整日志" 段记录。

### 2.2 字号 token（保留 + 补充）

```css
/* 已有 */
--text-base: clamp(1rem, 0.92rem + 0.4vw, 1.125rem);
--text-lead: clamp(1.125rem, 1rem + 0.5vw, 1.375rem);
--text-h3: clamp(1.5rem, 1.25rem + 0.75vw, 2rem);
--text-h2: clamp(2.25rem, 1.75rem + 1.5vw, 3.5rem);
--text-h1: clamp(3rem, 2rem + 4vw, 6rem);
--text-hero: clamp(3.5rem, 2rem + 7vw, 9rem);
--text-label: 0.75rem;

/* 新增 */
--text-sm: clamp(0.875rem, 0.85rem + 0.1vw, 0.9375rem);   /* helper text */
--text-mono-sm: 0.8125rem;                                /* mono labels */
--text-code: 0.9em;                                       /* code inside body — em 跟随 */
--text-callout-title: 0.78rem;                            /* callout uppercase title */
```

### 2.3 间距 token（保留 + 补充）

```css
/* 已有 */
--space-section: clamp(4rem, 3rem + 5vw, 10rem);
--space-stack-lg: clamp(2rem, 1.5rem + 1.5vw, 3.5rem);
--space-stack: clamp(1rem, 0.75rem + 1vw, 2rem);
--space-paragraph: clamp(0.75rem, 0.5rem + 0.5vw, 1.25rem);

/* 新增 */
--space-block-tight: 0.75rem;                             /* list item gap */
--space-block: 1rem;                                       /* default block stack */
--space-block-loose: 1.5rem;                              /* callout/code 上下 */
--space-inline-tight: 0.25rem;
--space-inline: 0.5rem;
--space-inline-loose: 0.75rem;
```

### 2.4 radius / shadow token（新增）

```css
--radius-sm: 0.25rem;
--radius: 0.5rem;
--radius-md: 0.75rem;
--radius-lg: 1rem;

--shadow-subtle: 0 1px 2px 0 hsl(220 13% 91% / 0.4);
--shadow-soft: 0 4px 12px -2px hsl(220 13% 60% / 0.18);
--shadow-inset-thin: inset 0 0 0 1px hsl(220 13% 91% / 0.6);

/* dark */
--shadow-subtle: 0 1px 2px 0 hsl(0 0% 0% / 0.4);
--shadow-soft: 0 4px 12px -2px hsl(0 0% 0% / 0.35);
```

---

## 3. Markdown 阅读系统（具体决策）

### 3.1 callout 体系

- **DOM 结构**（visitor 输出，与现有兼容）：

  ```html
  <aside class="markdown-alert markdown-alert-note" data-alert-type="note" role="note">
    <div class="markdown-alert-title">
      <svg aria-hidden="true" class="markdown-alert-icon">...</svg>
      <span class="markdown-alert-label">Note</span>
    </div>
    <p>正文 1</p>
    <p>正文 2</p>
  </aside>
  ```

- **icon set**（每个类型一个 SVG inline，路径直接写在 visitor 模板里，避免运行时 fetch）：

  | type | icon name (lucide) | viewBox |
  |---|---|---|
  | NOTE | `info` | 0 0 24 24 |
  | TIP | `lightbulb` | 0 0 24 24 |
  | IMPORTANT | `alert-circle` 或 `message-square-warning` | 0 0 24 24 |
  | WARNING | `alert-triangle` | 0 0 24 24 |
  | CAUTION | `octagon-x` 或 `shield-alert` | 0 0 24 24 |

  执行方在实现 `rehypeMarkdownAlerts` 时把 SVG path 直接 hardcode（项目本来就没装 lucide-react，避免新依赖）。

- **CSS**（与 token 联动）：

  ```css
  .markdown-alert {
    --alert-accent: var(--callout-note-accent);
    --alert-tint: var(--callout-note-tint);
    border-left: 0.25rem solid hsl(var(--alert-accent));
    background: hsl(var(--alert-tint));
    padding: var(--space-block) var(--space-block-loose);
    border-radius: var(--radius);
    box-shadow: var(--shadow-inset-thin);
    margin-block: var(--space-block-loose);
  }
  .markdown-alert-title {
    display: flex;
    align-items: center;
    gap: var(--space-inline);
    color: hsl(var(--alert-accent));
    font: 600 var(--text-callout-title) / 1 var(--font-mono);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    margin-block-end: var(--space-block);
  }
  .markdown-alert-icon { width: 1.1em; height: 1.1em; }
  .markdown-alert-note      { --alert-accent: var(--callout-note-accent);      --alert-tint: var(--callout-note-tint); }
  .markdown-alert-tip       { --alert-accent: var(--callout-tip-accent);       --alert-tint: var(--callout-tip-tint); }
  .markdown-alert-important { --alert-accent: var(--callout-important-accent); --alert-tint: var(--callout-important-tint); }
  .markdown-alert-warning   { --alert-accent: var(--callout-warning-accent);   --alert-tint: var(--callout-warning-tint); }
  .markdown-alert-caution   { --alert-accent: var(--callout-caution-accent);   --alert-tint: var(--callout-caution-tint); }
  ```

### 3.2 code block 体系

- **Shiki 多主题**（关键改动）：

  `src/lib/markdown.ts` `rehypeShiki` 中：

  ```ts
  const highlighter = await getOrCreateHighlighter({
    themes: ["github-light", "github-dark-default"],
    langs: ["ts", "tsx", "js", "jsx", "json", "bash", "shell", "css", "html", "md", "sql", "prisma", "yaml", "py", "rust"],
  });
  // hast: codeToHast with themes: { light: "github-light", dark: "github-dark-default" }
  ```

  shiki 4 会生成带 CSS 变量的 `<pre><code>`，并加 `--shiki-dark` 等 fallback 变量。在 `.markdown-body` 中：

  ```css
  .markdown-body pre.shiki { color: var(--shiki-light); background: var(--shiki-light-bg); }
  :root.dark .markdown-body pre.shiki { color: var(--shiki-dark); background: var(--shiki-dark-bg); }
  .markdown-body pre.shiki span { color: var(--shiki-light); }
  :root.dark .markdown-body pre.shiki span { color: var(--shiki-dark); }
  ```

  （或者 shiki "css-variables" 模式生成 inline style，参考 shiki 文档；具体写法在 implementation 决定，**不允许**让 light/dark 出现 layout shift。）

- **chrome bar 结构**：visitor 阶段或 React component 增强，在每个 `pre.shiki` 外加 wrapper：

  ```html
  <figure class="code-block" data-language="ts">
    <figcaption class="code-block-chrome">
      <span class="code-block-language">TS</span>
      <span class="code-block-filename">src/lib/markdown.ts</span>
      <button class="code-block-copy" aria-label="Copy code"><svg .../></button>
    </figcaption>
    <pre class="shiki ..."><code>...</code></pre>
  </figure>
  ```

  - `data-language` 由 fence ` ```ts ` 后的 lang 提取；
  - `filename` 由 fence meta ` ```ts title="src/foo.ts" ` 或 ` ```ts foo.ts ` 解析（设计 EC-D2 锁定 `title="..."`）；
  - copy button：visitor 时生成 inert 按钮，hydration 后通过客户端组件绑定 navigator.clipboard。

- **复制按钮 hydration**：新增 `MarkdownCopyButtons` 客户端组件，挂载到 `.markdown-body` 内 sweep 一次，给每个 `[data-code-copy]` 加 onClick。

### 3.3 inline code

```css
.markdown-body :not(pre) > code {
  background: hsl(var(--code-inline-bg));
  color: hsl(var(--code-inline-fg));
  font-size: 0.88em;
  padding: 0.15em 0.4em;
  border-radius: var(--radius-sm);
  border: 1px solid hsl(var(--border));
  font-family: var(--font-mono);
}
```

### 3.4 链接

```css
.markdown-body a:not(.markdown-alert-icon-link) {
  color: hsl(var(--fg));
  text-decoration: underline;
  text-decoration-color: hsl(var(--accent) / 0.55);
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.18em;
  transition: text-decoration-color var(--duration-fast) var(--ease-out-expo),
              background-color var(--duration-fast) var(--ease-out-expo);
}
.markdown-body a:hover {
  text-decoration-color: hsl(var(--accent));
  background: hsl(var(--accent) / 0.06);
}
```

### 3.5 标题 anchor

- `rehype-autolink-headings` wrap behavior 保留，但 `<a>` 上加 `aria-label="Permalink: ..."` 与 `data-heading-anchor`，hover 时显示 `#` 符号（用 `::before`）：

  ```css
  .markdown-body h2 > a::before,
  .markdown-body h3 > a::before {
    content: "#";
    opacity: 0;
    position: absolute;
    left: -1.2em;
    color: hsl(var(--muted-fg));
    font-weight: 400;
    transition: opacity var(--duration-fast);
  }
  .markdown-body h2:hover > a::before,
  .markdown-body h3:hover > a::before { opacity: 1; }
  ```

### 3.6 table

- 加横向 scroll wrapper（visitor 给 `<table>` 包 `<div class="md-table-scroll">`，CSS `overflow-x: auto`）
- zebra row（`tbody tr:nth-child(odd)` 微 muted）
- th 大写 mono + 浅 muted bg
- 边角圆 `--radius`

### 3.7 list / task list

- ul / ol 基础已 OK，补 nested 缩进 + bullet 区分
- task list：visitor 检测 `<li><input type="checkbox" disabled>`，加 `data-task-item` 与对应样式（用 `accent` 色填充已勾选）

### 3.8 hr / kbd / footnote

- hr：保留现状
- kbd：CSS 新增 `.markdown-body kbd { ... }`（mono + border + shadow-inset-thin + radius-sm）
- footnote：`remark-gfm` 自带，verify 样式可用

### 3.9 测试断言（写到 spec）

- 五个 alert variant 在 light + dark mode 下 token 值与 DOM 都被断言
- code block 双主题切换断言（`<html class="dark">` 时 background 改变）
- inline code 与 code block 边界断言（pre > code 无 border / background; :not(pre) > code 有）
- table responsive wrapper 断言
- task list checkbox 视觉断言

---

## 4. 编辑器源码契约（EC-D1 选型决策）

### 4.1 决策

**选 CodeMirror 6**（design-research RES-DEC-3）。

**reasoning recap**：

- CM6 70kb gzip dynamic import，仅 admin chunk 受影响
- `@codemirror/lang-markdown` 提供成熟 markdown grammar
- 与 systemPatterns §14 "编辑区必须保留 Markdown 原文" 严格一致
- 不会有 markdown ↔ AST round-trip 失真

### 4.2 新增依赖

```
codemirror@^6
@codemirror/state@^6
@codemirror/view@^6
@codemirror/lang-markdown@^6
@codemirror/language@^6
@codemirror/commands@^6
@codemirror/search@^6
```

**删除依赖**：

```
@tiptap/react
@tiptap/starter-kit
@tiptap/extension-link
@tiptap/extension-image
@tiptap/extension-code-block-lowlight
tiptap-markdown
lowlight
```

总变化：约 +70kb / -110kb gzip（dynamic import 后首屏 0 改动；admin chunk 净 -40kb）。

### 4.3 组件契约

- `MarkdownEditor` 重写：

  ```tsx
  interface MarkdownEditorProps {
    value: string;
    onChange: (markdown: string) => void;
    placeholder?: string;
    className?: string;
    /** 提供编辑器实例的引用（供测试 / 高级集成）。MVP 阶段可选。 */
    onReady?: (api: { focus: () => void; insert: (text: string) => void }) => void;
  }
  ```

  - 内部 useEffect 创建 EditorView，配 `EditorState.create({ doc: value, extensions: [markdown(), lineNumbers(), keymap.of(...), ...] })`
  - listener `EditorView.updateListener.of((u) => { if (u.docChanged) onChange(u.state.doc.toString()); })`
  - value 外部变化时 dispatch `transaction({ changes: { from: 0, to: doc.length, insert: value } })`

- `MarkdownEditorWithPreview` 重写：左 `<MarkdownEditor>` / 右 `<MarkdownLivePreview value>`；预览实现见 §5。

### 4.4 toolbar

- 当前 `EditorToolbar` 与 tiptap commands 紧耦合，必须重写
- 新 toolbar 通过 `editorRef.current?.insert(text)` 在光标位置插入 markdown 字符
  - **Bold**：包裹 `**...**`
  - **Italic**：包裹 `*...*`
  - **Code (inline)**：包裹 `` `...` ``
  - **Heading**：行首插 `## `
  - **List ul / ol**：行首插 `- ` / `1. `
  - **Quote / Callout**：行首插 `> ` 或 `> [!NOTE]\n`
  - **Code fence**：插入 ` ```ts\n\n``` `
  - **Link**：插入 `[text](url)` 或对选中文字包裹
  - **Image**：弹 dialog 选媒体后插 `![alt](url)`
  - **Table**：插入预制模板

- toolbar 必须保留快捷键提示（`title="Bold (⌘B)"`）和键盘 shortcuts

### 4.5 placeholder 与 empty state

- 空文档时编辑区显示 placeholder 文本（半透明）
- 用 CM6 placeholder extension

### 4.6 不变量

- **任何加载 → 编辑 → 保存 → 重新加载** 的循环，markdown 字符串字面一致（包括空行、heading 缩进、list 风格、HTML 内联）
- 这是 EC-S2 / EC-S3 的硬约束，必须有 round-trip 测试

---

## 5. 预览一致性（EP）

### 5.1 实现选型

**选 client-side full pipeline**（design-research §7）。

- `MarkdownLivePreview` 客户端组件，内部 dynamic import `@/lib/markdown-client`（专门给客户端用的 thin wrapper，复用 server-side `renderMarkdown`）
- `renderMarkdown` 函数本身应该是 isomorphic（unified / remark / rehype 都是 isomorphic；shiki 也 isomorphic）
- **关键**：服务端和客户端走**完全同一份 `renderMarkdown`** 函数。spec EP-1 强制断言两者输出 hash 相同。
- 用 web worker 跑 markdown→html，避免主线程阻塞（如果 spec EP-4 性能基准跑不过则退化为主线程 + requestIdleCallback）

### 5.2 同步策略

- debounce 200ms
- abortable：新键击时 cancel 进行中的渲染
- 错误显示：parse error 时在预览顶部 banner 显示错误位置和提示，**不**显示空白或上次结果

### 5.3 预览 chrome

- 与发布态详情页用**完全相同**的 wrapper：`<article class="markdown-body max-w-none">`
- 不允许在预览区加任何"This is a preview"水印 chrome（用户已经知道这是预览；加水印分散注意）

### 5.4 sandbox

- 预览 HTML 经过 `rehype-sanitize`（与发布态同一份），保证 paste 进恶意 HTML 不会 XSS

---

## 6. 首页系统决策

### 6.1 信息架构

按 design-research §5 锁定七段：

1. **Hero**（manifesto + subtitle + dual CTA + "Now" badge）
2. **Featured + Recent**（1 large + 5-8 small）
3. **Columns**（3-4 column card with count + description）
4. **Engineering Principles / Notes**（3-4 条）
5. **Tech Topics / GitHub activity**（复用 TechStack + GithubCard）
6. **Site Stats**（mono 单行）
7. **Footer**（已有 SiteFooter，加视觉强度）

### 6.2 组件计划

| section | 组件 | 状态 |
|---|---|---|
| Hero | `HomeHero`（替代 `HeroEditorial`）| 重写 |
| Featured + Recent | `HomeFeatured` + `HomeRecent` | 新增（替代 page.tsx 内联 recent posts） |
| Columns | `HomeColumns` | 新增 |
| Principles | `HomePrinciples` | 新增 |
| Tech / GitHub | 复用 `TechStack` + `GithubCard` | 微调 |
| Stats | `HomeStats`（重写，改 mono 单行） | 重写 |

`HomeHero` 与 `HeroEditorial` 命名差异让 grep 不会混淆。

### 6.3 视觉装饰

- **保留**：launch-surface、launch-orbit
- **新增**：dot-grid background（CSS background-image radial-gradient repeat）
- **新增**：grain noise overlay（CSS background-image data:url SVG turbulence）
- **新增**：scroll reveal（IntersectionObserver hook，进入 viewport 加 `data-revealed`）

### 6.4 动效预算

- 入场 reveal：800ms ease-out-expo
- hover-translate-2px / 阴影深化
- scroll reveal：上方往下 fade + translateY(16px)
- `prefers-reduced-motion` 时全部走 `transition: none` + `transform: none`

---

## 7. About 系统决策

### 7.1 信息架构（八段）

1. AboutHero（**改写**：内容到具体 + 头像可选 + Now badge）
2. AboutNow（**保留 + 扩展**：4 列 Shipping / Writing / Hardening / Reading）
3. AboutProjectIntent（**新增**：项目定位 + 目标用户 + 不做的事 + 当前状态）
4. AboutTechStack（**新增**：技术选型表 + 每项理由，迁移自首页 TechStack）
5. AboutImplementationApproach（**新增**：自研 CMS / 自研 analytics / Docker / SDD 工作流）
6. AboutPrinciples（**保留 + 扩展**：6-8 条原则）
7. AboutFutureRoadmap（**新增**：V2/V3 backlog 摘要，链接 deferred-v2-v3.md）
8. AboutContact（**保留**）

### 7.2 内容约束

- 每段必须包含具体事实（数字 / 文件名 / 决策日期 / 实际数据），不允许全是泛泛形容词
- 引用 SDD / memory-bank 的具体决策（"我们决定自研 Analytics 是因为..."）
- 提供至少一项"可信物料"：架构图（ASCII art）/ 截图 / 代码片段 / 时间线 / 实际数据
- 写作语气：第一人称 + 谦逊 + 工程化（"I built this to learn how X. Here is what I got right, and what I got wrong."）

### 7.3 视觉

- 与首页共用 launch-surface + launch-panel
- AboutTechStack 用横向 dl grid（已有 dl pattern from AboutNow）
- AboutImplementationApproach 用 timeline 或 numbered list

---

## 8. 后台 admin 决策

### 8.1 Layout 改造

- `src/app/(admin)/admin/layout.tsx` 抽出**两个**组件：
  - `AdminSidebar`（左侧 nav，已存在但 layout 内联未引用，本轮**强制采用** `AdminSidebar` 而不是 layout 内嵌）
  - `AdminHeader`（顶部 user menu + breadcrumb）
- nav items 由独立 const 数组定义，单一来源

### 8.2 sidebar

```tsx
const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/admin/posts", label: "Posts", icon: <FileText /> },
  { href: "/admin/columns", label: "Columns", icon: <Bookmark /> },
  { href: "/admin/comments", label: "Comments", icon: <MessageSquare /> },
  { href: "/admin/media", label: "Media", icon: <Image /> },
  // analytics 走 /admin（dashboard 即 analytics），不单列；见 incomplete-pages-inventory
  // settings 移到 V2，本轮 sidebar 不展示
];
```

- active state：基于 `usePathname()`，含 startsWith 判断
- 视觉：`data-active="true"` 时 left border 2px accent + bg sidebar-bg-active + text sidebar-fg-hover + font-medium
- icons 用 lucide path 内联（不引入 lucide-react，避免 SSR 兼容问题）；或者降级用 unicode symbol

### 8.3 Header

- breadcrumb：基于路径解析，例如 `Dashboard / Posts / New`
- user menu：dropdown，含邮箱 + logout
- 移动端：sidebar 抽屉

### 8.4 表格密度调整

- 行高保留 py-2（紧密度合理）
- 加 zebra：`tbody tr:nth-child(odd) { background: hsl(var(--table-row-zebra)); }`
- 加 row hover：`tbody tr:hover { background: hsl(var(--table-row-hover)); }`
- table 圆角：包 `<div class="rounded-md border bg-card overflow-hidden">`

### 8.5 表单 / 空状态 / 危险操作

- form helper text：`text-sm text-muted-fg`（依赖 muted-fg 已调亮）
- form error：`text-sm text-destructive`
- 危险操作 按钮：行内用 `<button class="text-destructive">`，独立按钮用 `<Button variant="destructive">`（shadcn 已有）
- 空状态：统一组件 `EmptyState`（icon + 标题 + 描述 + 可选 CTA），所有 admin 列表页空时显示

### 8.6 缺失页面收口

详见 `incomplete-pages-inventory.md`，三项决定：

- `/admin/_editor-demo`：从 sidebar 删除，但保留路由（仅开发用）
- `/admin/analytics`：从 sidebar 删除（dashboard 在 `/admin` 已有；如果 sidebar 想留个"Analytics" 链接可指 `/admin`，但避免重复）
- `/admin/settings`：从 sidebar 删除，V2 backlog

---

## 9. 多语言决策

详见 `i18n-current-state.md`。

**本设计文档锁定的不变量**：

- 不增加 `app/[lang]` 路由
- 不替换 `getCurrentLocale()` 实现
- 不引入 next-intl
- `SUPPORTED_LOCALES = ["zh", "en"]` 保留作为 schema 字段约束，但**前端 UI 不暴露语言切换**
- `<html lang="zh-CN">` 写死在 RootLayout
- OG 图、RSS、sitemap 都保持单 locale 输出
- About / README / sitemap robots 加显式声明"中文单语言站点"

---

## 10. 浏览器审查决策

- 必审路由（7 个）：`/`、`/about`、`/posts`、`/posts/[slug]`、`/admin`、`/admin/posts`、`/admin/posts/new`
- 扩展路由（5 个）：`/posts/[slug]?theme=dark`、`/admin/comments`、`/admin/columns`、`/admin/media`、`/login`
- 每个路由 5 维度：layout / typography / contrast / state / markdown
- 失败时按 `browser-audit-checklist.md` issue-log 模板记录

---

## 11. 依赖增减一览（强约束）

**新增**：

- `codemirror@^6` + `@codemirror/state@^6` + `@codemirror/view@^6` + `@codemirror/lang-markdown@^6` + `@codemirror/language@^6` + `@codemirror/commands@^6` + `@codemirror/search@^6`
- （**可选**）`@codemirror/theme-one-dark@^6`（如果不接受则自写 minimal theme）

**删除**：

- `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-link` + `@tiptap/extension-image` + `@tiptap/extension-code-block-lowlight`
- `tiptap-markdown`
- `lowlight`

**Shiki 主题**（不算新依赖，shiki 4 自带）：

- 新增 `github-light` theme to `langs/themes` config

**保持现状**：

- 不引入 `lucide-react` / `framer-motion` / `@uiw/react-textarea-code-editor` / `marked` / `DOMPurify`（DOMPurify 已经被 `rehype-sanitize` 替代）

---

## 12. 调整日志（implementation 期间填）

> 实施中若需偏离本文 token / 决策，记录在此。

| 日期 | 偏离项 | 偏离方向 | 理由 | 同步影响 |
|---|---|---|---|---|
| 2026-05-23 | `--callout-note-accent` light | 220 70% 55% → 220 70% 52% | MR-1.4 contrast helper 实测 accent on tint 4.06:1，需提升到 ≥4.5:1 | CSS token 同步 |
| 2026-05-23 | `--callout-tip-accent` light | 155 58% 36% → 155 58% 31% | MR-1.4 contrast helper 实测 accent on tint 3.66:1，需提升到 ≥4.5:1 | CSS token 同步 |
| 2026-05-23 | `--callout-warning-accent` light | 38 92% 42% → 38 92% 31% | MR-1.4 contrast helper 实测 accent on tint 2.74:1，需提升到 ≥4.5:1 | CSS token 同步 |
| 2026-05-23 | `--callout-caution-accent` light | 0 72% 50% → 0 72% 48% | MR-1.4 contrast helper 实测 accent on tint 4.32:1，需提升到 ≥4.5:1 | CSS token 同步 |

执行方在每次微循环中如有偏离都必须填一行。
