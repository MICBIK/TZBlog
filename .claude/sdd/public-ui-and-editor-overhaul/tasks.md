# Tasks — public-ui-and-editor-overhaul

> 按 SDD 微循环结构组织：每条 spec 拆 `[TEST-RED]` + `[IMPL-GREEN]` 两步；commit pair 强制。
> 强约束：本表是 implementation 阶段的**单一来源**，执行方按顺序消费；勾选完成的同时更新 memory-bank/progress.md。
> 微循环工作量 ≤30 分钟（CLAUDE.md SDD §3）。
> Commit 命名：`test(<scope>): <spec-id>` / `feat(<scope>): <spec-id>` / 可选 `refactor(<scope>): <desc>`。
> 无 [no-tdd] 标签的 feat 必须前 5 commit 内有对应 scope 的 test commit（husky commit-msg hook 强制）。

---

## 0. Scope 命名约定

各 capability 的 git `<scope>`：

| Capability | scope |
|---|---|
| markdown-reading | `markdown` |
| editor-source-contract | `editor` |
| editor-preview-parity | `preview` |
| home-redesign | `home` |
| about-redesign | `about` |
| admin-readability | `admin` |
| incomplete-pages-inventory | `admin` 或 `nav` |
| i18n-current-state-audit | `i18n-docs`（仅文档） |

---

## 1. Milestone 划分（三阶段）

| Milestone | 包含 capability | 出口条件 |
|---|---|---|
| **M1 — 基础重做** | editor-source-contract / editor-preview-parity / markdown-reading | typecheck + lint + 全量 test + build 四绿；admin posts 编辑器源码可见、预览与发布态视觉一致 |
| **M2 — 视觉重做** | admin-readability / home-redesign / about-redesign | 四绿；浏览器审查 7 个核心路由完成 |
| **M3 — 收口** | incomplete-pages-inventory / i18n-current-state-audit / 浏览器审查 / 文档同步 | 全量四绿；完整浏览器审查归档；memory-bank 同步；归档到 archive/ |

每个 milestone 完成前不允许提前进入下一个 milestone（避免并行修改互相破坏）。

---

## 2. Pre-flight（实施前必做）

> 在写第一行测试 / 实现代码前完成。

- [x] **P-1**：执行方阅读全部 11 份交付文档（按 proposal §11 顺序）
- [x] **P-2**：跑 `pnpm typecheck && pnpm lint && pnpm test && pnpm build` 确认当前基线四绿
- [x] **P-3**：记录当前 `pnpm test` 通过数（应该是 460 passed / 1 skipped），作为不退化基线
- [x] **P-4**：记录当前 `pnpm build` 输出 admin chunk size 与首页 chunk size，作为 EC-6.2 / EP-5.2 比较基线
- [x] **P-5**：创建工作分支 `feat/public-ui-and-editor-overhaul`，从 main 切出
- [x] **P-6**：确认 design-notes.md §2 token 设计已对齐 ha1den 期望（如有顾虑，写到 design-notes 末尾 "调整日志" 并等回复）
- [x] **P-7**：确认 design-notes §4 编辑器选型（CodeMirror 6）已对齐 ha1den；如反对则切方案 B（react-simple-code-editor），更新 design-notes EC-D1 决策
- [x] **P-8**：跑 dev server `pnpm dev`，确保本地 admin 登录可用（用 `admin@example.com`，绕过 KI-001 zod 邮箱校验）

Pre-flight evidence (2026-05-23):

- `pnpm typecheck`: pass.
- `pnpm lint`: pass.
- `pnpm test`: 89 files / 473 passed / 1 skipped.
- `pnpm build`: pass; Next.js 16.2.6 Turbopack, 30 static pages generated.
- Client entry JS baseline (sum of route entry chunks, gzip): `/` 13.0 KiB, `/admin` 12.6 KiB, `/admin/posts/new` 279.8 KiB.
- Branch: `feat/public-ui-and-editor-overhaul` from `main` at `5384146`.
- Local admin smoke: seeded `admin@example.com`; login with `.env` credentials redirects to `/admin`.

---

## 3. M1 微循环任务

### 3.1 M1-A：markdown 测试与渲染管道（spec MR-*）

> 顺序：先扩 globals.css token & rehype visitor（impl-heavy），测试随之；spec 之间允许小范围交错。

#### M1-A-1 [TEST-RED] MR-1.1 callout token 五分类 × 两套

- [x] 在 `src/app/globals.test.ts` 加 spec：断言 `:root` 与 `.dark` 含 10 个 callout token（5 type × accent/tint）
- [x] 跑测试见 FAIL（token 不存在）
- commit: `test(markdown): MR-1.1 callout tokens existence`

#### M1-A-2 [IMPL-GREEN] MR-1.1 添加 callout token

- [x] 在 `src/app/globals.css` `:root` 和 `.dark` 加 design-notes §2.1 列出的 10 个 callout token
- [x] 跑测试见 PASS
- commit: `feat(markdown): MR-1.1 callout tokens`

#### M1-A-3 [TEST-RED] MR-1.4 callout 对比度

- [x] 创建 `src/lib/visual/contrast.ts`（helper：HSL → RGB → luminance → ratio）
- [x] 在 `globals.test.ts` 加 spec：5 type × light/dark 各算 accent on tint 对比度 ≥ 4.5
- [x] 跑见 FAIL（如有未达标 token，按 design-notes 调整）
- commit: `test(markdown): MR-1.4 callout contrast`

#### M1-A-4 [IMPL-GREEN] MR-1.4 微调 token 达标

- [x] 微调 callout token L 值直到全部对比度通过
- [x] 微调记入 design-notes §12 "调整日志"
- commit: `feat(markdown): MR-1.4 callout contrast pass`

#### M1-A-5 [TEST-RED] MR-1.2 callout DOM 结构升级

- [ ] 在 `src/lib/markdown.test.ts` 扩展 alert spec：断言 `aside.markdown-alert.markdown-alert-{type}[role=note][data-alert-type]` + `div.markdown-alert-title` + `svg.markdown-alert-icon` + `span.markdown-alert-label`
- [ ] FAIL
- commit: `test(markdown): MR-1.2 callout DOM`

#### M1-A-6 [IMPL-GREEN] MR-1.2 visitor 升级

- [ ] 在 `src/lib/markdown.ts` `rehypeMarkdownAlerts` visitor 升级 emit DOM
- [ ] PASS
- commit: `feat(markdown): MR-1.2 callout DOM`

#### M1-A-7 [TEST-RED] MR-1.3 icon SVG 内联

- [ ] 在 `src/lib/markdown.test.ts` 加 spec：每 type 内含正确 SVG path（NOTE=info / TIP=lightbulb / IMPORTANT=alert-circle / WARNING=alert-triangle / CAUTION=octagon-x）
- [ ] FAIL
- commit: `test(markdown): MR-1.3 icon svg`

#### M1-A-8 [IMPL-GREEN] MR-1.3 visitor 插入 SVG

- [ ] visitor 按 type lookup 一个 inline SVG map
- [ ] PASS
- commit: `feat(markdown): MR-1.3 icon svg`

#### M1-A-9 [TEST-RED] MR-1.5 dark mode inner outline

- [ ] `globals.test.ts` 加 spec：`.dark .markdown-alert` 含 box-shadow inset
- [ ] FAIL
- commit: `test(markdown): MR-1.5 dark outline`

#### M1-A-10 [IMPL-GREEN] MR-1.5 加 inset shadow

- [ ] `globals.css` `.dark .markdown-alert { box-shadow: inset 0 0 0 1px hsl(var(--alert-accent) / 0.25); }`
- [ ] PASS
- commit: `feat(markdown): MR-1.5 dark outline`

#### M1-A-11 [TEST-RED] MR-1.2 callout CSS 重构到 token

- [ ] `globals.test.ts` 加断言：`.markdown-alert-note` 等不再含硬编码 hsl 数字（grep 字符串 `hsl(220 70% 55%)` 不出现在 `.markdown-alert-*` 规则段）
- [ ] FAIL
- commit: `test(markdown): MR-1.2 callout css refactor`

#### M1-A-12 [IMPL-GREEN] MR-1.2 callout CSS 改 token

- [ ] `globals.css` `.markdown-alert-note { --alert-accent: var(--callout-note-accent); --alert-tint: var(--callout-note-tint); }` 等
- [ ] PASS
- commit: `feat(markdown): MR-1.2 callout css refactor`

#### M1-A-13 [TEST-RED] MR-2.1 shiki dual-theme 配置

- [ ] `src/lib/markdown.test.ts` 加 spec：getOrCreateHighlighter 调用 themes: { light, dark }
- [ ] FAIL
- commit: `test(markdown): MR-2.1 shiki dual-theme config`

#### M1-A-14 [IMPL-GREEN] MR-2.1 shiki dual-theme

- [ ] `src/lib/markdown.ts:52` 改成 `themes: { light: "github-light", dark: "github-dark-default" }`
- [ ] highlighter init 同步
- [ ] PASS
- commit: `feat(markdown): MR-2.1 shiki dual-theme`

#### M1-A-15 [TEST-RED] MR-2.2 dual-theme HTML output

- [ ] spec：渲染含 code block，断言输出含 CSS variable 或双套 token（具体 strategy 实施时定）
- [ ] FAIL
- commit: `test(markdown): MR-2.2 shiki dual-theme output`

#### M1-A-16 [IMPL-GREEN] MR-2.2 dual-theme transformer

- [ ] visitor 内调用 `codeToHast` with multi-theme
- [ ] CSS 加 `.shiki` selector 用 CSS variable / 双 wrapper
- [ ] PASS
- commit: `feat(markdown): MR-2.2 shiki dual-theme output`

#### M1-A-17 [TEST-RED] MR-3.1 code-block figure wrapper

- [ ] spec：渲染 ` ```ts code ``` ` 后含 `<figure class="code-block" data-language="ts">`
- [ ] FAIL
- commit: `test(markdown): MR-3.1 code-block figure`

#### M1-A-18 [IMPL-GREEN] MR-3.1 visitor 加 figure

- [ ] visitor 把 shiki pre 包在 figure 中
- [ ] PASS
- commit: `feat(markdown): MR-3.1 code-block figure`

#### M1-A-19 [TEST-RED] MR-3.2 filename meta parse

- [ ] spec：` ```ts title="src/foo.ts" code ``` ` 输出含 `<span class="code-block-filename">src/foo.ts</span>`
- [ ] 无 title 时不输出该 span
- [ ] FAIL
- commit: `test(markdown): MR-3.2 code-block filename`

#### M1-A-20 [IMPL-GREEN] MR-3.2 fence meta parse

- [ ] visitor 解析 fence meta 取 title="..."
- [ ] PASS
- commit: `feat(markdown): MR-3.2 code-block filename`

#### M1-A-21 [TEST-RED] MR-3.3 copy button stub

- [ ] spec：每 code-block figure 末尾含 `<button class="code-block-copy" data-copy aria-label="复制代码">`
- [ ] FAIL
- commit: `test(markdown): MR-3.3 copy button stub`

#### M1-A-22 [IMPL-GREEN] MR-3.3 visitor 加 copy button

- [ ] visitor 加 button stub（含 SVG icon）
- [ ] PASS
- commit: `feat(markdown): MR-3.3 copy button stub`

#### M1-A-23 [TEST-RED] MR-3.4 / MR-3.5 inline code 不被 figure 包

- [ ] spec：inline `<code>` 不在 figure 内；inline code style 仍然有 border / bg
- [ ] FAIL
- commit: `test(markdown): MR-3.5 inline code`

#### M1-A-24 [IMPL-GREEN] MR-3.5 inline code 保留独立 CSS

- [ ] visitor 只处理 `pre > code`；inline `code` 保持原渲染
- [ ] PASS
- commit: `feat(markdown): MR-3.5 inline code`

#### M1-A-25 [TEST-RED] MR-3.4 MarkdownCopyButtons 客户端组件

- [ ] 新建 `src/components/markdown/MarkdownCopyButtons.test.tsx`：mock clipboard，断言点击后 writeText 调用 + toast
- [ ] FAIL（组件不存在）
- commit: `test(markdown): MR-3.4 copy button client`

#### M1-A-26 [IMPL-GREEN] MR-3.4 MarkdownCopyButtons 实现

- [ ] 新建 `src/components/markdown/MarkdownCopyButtons.tsx`：客户端 `"use client"`，`useEffect` 扫 `[data-copy]`，绑定 click
- [ ] 在详情页 `posts/[slug]/page.tsx` mount 此组件（在 article 内）
- [ ] PASS
- commit: `feat(markdown): MR-3.4 copy button client`

#### M1-A-27 [TEST-RED] MR-3.6 chrome bar CSS token

- [ ] `globals.test.ts` 加 spec：`.code-block-chrome` 含 `hsl(var(--code-chrome-bg))` 等
- [ ] FAIL
- commit: `test(markdown): MR-3.6 chrome bar css`

#### M1-A-28 [IMPL-GREEN] MR-3.6 chrome bar CSS

- [ ] `globals.css` 加完整 `.code-block` / `.code-block-chrome` / `.code-block-language` / `.code-block-filename` / `.code-block-copy` 样式
- [ ] PASS
- commit: `feat(markdown): MR-3.6 chrome bar css`

#### M1-A-29 [TEST-RED] MR-4.1 table responsive wrapper

- [ ] `markdown.test.ts` 加 spec：渲染 table 后含 `<div class="md-table-scroll">` wrapper
- [ ] FAIL
- commit: `test(markdown): MR-4.1 table scroll wrapper`

#### M1-A-30 [IMPL-GREEN] MR-4.1 visitor 加 wrapper

- [ ] visitor 处理 `<table>` 包在 `<div class="md-table-scroll">`
- [ ] CSS 加 `.md-table-scroll { overflow-x: auto; }`
- [ ] PASS
- commit: `feat(markdown): MR-4.1 table scroll wrapper`

#### M1-A-31 [TEST-RED] MR-4.2 zebra + th CSS

- [ ] `globals.test.ts` 加 spec：`.markdown-body tbody tr:nth-child(odd)` 含 `hsl(var(--table-row-zebra))`；`.markdown-body th` 含 mono uppercase
- [ ] FAIL
- commit: `test(markdown): MR-4.2 table styles`

#### M1-A-32 [IMPL-GREEN] MR-4.2 加 CSS

- [ ] `globals.css` 加 table 样式 + 加 table tokens
- [ ] PASS
- commit: `feat(markdown): MR-4.2 table styles`

#### M1-A-33 [TEST-RED] MR-5.1 task list checkbox 视觉

- [ ] `globals.test.ts` 加 spec：`.markdown-body li input[type="checkbox"]` 含 `accent-color: hsl(var(--accent))`
- [ ] FAIL
- commit: `test(markdown): MR-5.1 task list`

#### M1-A-34 [IMPL-GREEN] MR-5.1 加 CSS

- [ ] `globals.css` 加 task list checkbox 样式
- [ ] PASS
- commit: `feat(markdown): MR-5.1 task list`

#### M1-A-35 [TEST-RED] MR-6.1 kbd 样式

- [ ] `globals.test.ts` 加 spec：`.markdown-body kbd` 含 token 引用
- [ ] FAIL
- commit: `test(markdown): MR-6.1 kbd`

#### M1-A-36 [IMPL-GREEN] MR-6.1 加 CSS + 加 kbd token

- [ ] `globals.css` 加 `--kbd-*` token + `.markdown-body kbd { ... }` 样式
- [ ] PASS
- commit: `feat(markdown): MR-6.1 kbd`

#### M1-A-37 [TEST-RED] MR-7.1 / MR-7.2 / MR-7.3 nested list / blockquote / hr

- [ ] `markdown.test.ts` 加 3 个 spec
- [ ] FAIL
- commit: `test(markdown): MR-7.* nested list / bq / hr`

#### M1-A-38 [IMPL-GREEN] 调样式

- [ ] `globals.css` 微调 nested list 缩进、blockquote multi-paragraph、hr 视觉
- [ ] PASS
- commit: `feat(markdown): MR-7.* nested list / bq / hr`

#### M1-A-39 [TEST-RED] MR-8.4 .markdown-body 覆盖率 sweep

- [ ] `globals.test.ts` 加 spec：grep selector 字符串列表
- [ ] FAIL（如有缺失）
- commit: `test(markdown): MR-8.4 selectors sweep`

#### M1-A-40 [IMPL-GREEN] 补缺 CSS

- [ ] 按缺失项补
- [ ] PASS
- commit: `feat(markdown): MR-8.4 selectors`

#### M1-A-41 [TEST-RED] MR-8.5 详情页完整 fixture

- [ ] 创建 `src/lib/markdown/__fixtures__/full-syntax.md`
- [ ] 扩展 `posts/[slug]/page.test.tsx`：用 fixture mock content，断言 DOM 含所有结构
- [ ] FAIL
- commit: `test(markdown): MR-8.5 full syntax fixture`

#### M1-A-42 [IMPL-GREEN] 全部 PASS

- [ ] 上面 spec 已完整实施后此条自然通过
- [ ] PASS
- commit: `feat(markdown): MR-8.5 full syntax integration` *(如需调整 page 才加 commit；如已 PASS 可作为 no-op 跳过)*

#### M1-A-43 [TEST-RED] MR-10 性能 baseline

- [ ] 加 spec 测 large markdown render time ≤ 基线 × 1.3
- [ ] FAIL or PASS（依实际情况）
- commit: `test(markdown): MR-10 perf`

#### M1-A-44 [IMPL-GREEN] 若不达标优化

- [ ] highlighter 复用检查 / lazy load language grammars
- [ ] PASS
- commit: `feat(markdown): MR-10 perf` *(如基线已达标可跳过)*

**M1-A 出口检查**：

- [ ] `pnpm test` 全绿，测试通过数 = 基线 + N（N 见各 spec 新增数）
- [ ] `pnpm typecheck && pnpm lint` 绿
- [ ] `pnpm build` 绿
- [ ] 浏览器手动渲染一篇 fixture markdown 文章；五个 callout / code block chrome / table 全部视觉正确

---

### 3.2 M1-B：编辑器源码契约（spec EC-*）

> 顺序：先 PoC 在 `_editor-demo` 沙箱 → 通过后切到 PostEditor → 删 tiptap 依赖。

#### M1-B-1 [TEST-RED] EC-1.1 / EC-1.2 编辑区文字字面 + no prose

- [ ] 新建 `src/components/editor/MarkdownEditor.test.tsx`：用 RTL render，断言 `cm-content` 文本字面是 markdown 字符 + 容器无 prose class
- [ ] FAIL（组件还是 tiptap）
- commit: `test(editor): EC-1.1 literal source`

#### M1-B-2 [IMPL-GREEN] 安装 CodeMirror 6 依赖

- [ ] `pnpm add codemirror @codemirror/state @codemirror/view @codemirror/lang-markdown @codemirror/language @codemirror/commands @codemirror/search`
- [ ] commit: `chore(editor): add codemirror 6 deps [no-tdd]` *（chore 类，加 [no-tdd] 标）*

#### M1-B-3 [IMPL-GREEN] EC-1.1 重写 MarkdownEditor 用 CM6

- [ ] 重写 `src/components/editor/MarkdownEditor.tsx`：useEffect + EditorState + EditorView + lang-markdown + lineNumbers + keymap + placeholder
- [ ] dynamic import 仅在 client load
- [ ] export props 保持 (value/onChange/placeholder/className/onReady)
- [ ] PASS EC-1.1 / EC-1.2 测试
- commit: `feat(editor): EC-1.1 codemirror 6 source editor`

#### M1-B-4 [TEST-RED] EC-2.1 round-trip 测试

- [ ] 新建 `src/lib/editor/round-trip.test.ts`：fixture 5+ markdown 字符串，验证注入后导出字面相同
- [ ] FAIL（CM6 set + emit 应该字面一致，但如果实现错也可能 FAIL）
- commit: `test(editor): EC-2 round-trip`

#### M1-B-5 [IMPL-GREEN] EC-2.x round-trip 确认

- [ ] 验证 CM6 `state.doc.toString()` 不修改原文
- [ ] PASS
- commit: `feat(editor): EC-2 round-trip` *(如已 PASS 可作 docs commit `chore(editor): EC-2 round-trip verified [no-tdd]`)*

#### M1-B-6 [TEST-RED] EC-3.1 toolbar 按钮集

- [ ] 新建 `src/components/editor/EditorToolbar.test.tsx`：断言含必备按钮（Bold / Italic / Code / H2 / H3 / UL / OL / Quote / Code Block / Link / Image / Table / Callout）
- [ ] FAIL（toolbar 还是 tiptap 老 toolbar）
- commit: `test(editor): EC-3.1 toolbar buttons`

#### M1-B-7 [IMPL-GREEN] EC-3.1 重写 EditorToolbar

- [ ] 重写 `src/components/editor/EditorToolbar.tsx`：接收 editorRef，按钮调用 `editorRef.insert(text)` API
- [ ] PASS
- commit: `feat(editor): EC-3.1 toolbar buttons`

#### M1-B-8 [TEST-RED] EC-3.2 Bold action 包裹

- [ ] 加 spec：模拟选中文本 + click Bold，断言新文本含 `**...**`
- [ ] FAIL
- commit: `test(editor): EC-3.2 bold action`

#### M1-B-9 [IMPL-GREEN] EC-3.2 wrap selection helper

- [ ] 在 MarkdownEditor 暴露 `wrapSelection(prefix, suffix)` API；toolbar Bold 调用 `wrapSelection("**", "**")`
- [ ] PASS
- commit: `feat(editor): EC-3.2 bold action`

#### M1-B-10 [TEST-RED] EC-3.3 H2 行首插入

- [ ] spec：H2 button → 行首插入 `## `
- [ ] FAIL
- commit: `test(editor): EC-3.3 h2 action`

#### M1-B-11 [IMPL-GREEN] EC-3.3 H2 action

- [ ] toolbar H2 调用 `prependToLine("## ")`
- [ ] PASS
- commit: `feat(editor): EC-3.3 h2 action`

#### M1-B-12..15 [TEST/IMPL pairs] EC-3.4 / EC-3.5 / EC-3.6 / EC-3.7 各 toolbar action

- [ ] 每个 action 一对 RED / GREEN commit
- commit pairs:
  - `test(editor): EC-3.4 code block action` / `feat(editor): EC-3.4 code block action`
  - `test(editor): EC-3.5 callout action` / `feat(editor): EC-3.5 callout action`
  - `test(editor): EC-3.6 link dialog action` / `feat(editor): EC-3.6 link dialog action`
  - `test(editor): EC-3.7 image media dialog` / `feat(editor): EC-3.7 image media dialog`

#### M1-B-16 [TEST-RED] EC-4 quirks 组合（tab / list / line-num / placeholder / cmd+s / brackets）

- [ ] 在 MarkdownEditor.test.tsx 加 6 个 spec（一次性 RED 多个）
- [ ] FAIL
- commit: `test(editor): EC-4 quirks`

#### M1-B-17 [IMPL-GREEN] EC-4 quirks 配置

- [ ] CM6 extensions: closeBrackets, lineNumbers, placeholder, keymap.of([{ key: "Mod-s", run: onSave }, indentWithTab])
- [ ] PASS
- commit: `feat(editor): EC-4 quirks`

#### M1-B-18 [TEST-RED] EC-5.3 SSR 安全

- [ ] 在 `posts/new/page.test.tsx` 加 spec：dynamic import 编辑器、render 不抛 hydration mismatch
- [ ] FAIL or PASS（取决于现实现）
- commit: `test(editor): EC-5.3 ssr safety`

#### M1-B-19 [IMPL-GREEN] dynamic import wrapper

- [ ] 重写 `MarkdownEditorWithPreview` 把 MarkdownEditor 套 `dynamic(() => import("./MarkdownEditor"), { ssr: false })`
- [ ] PASS
- commit: `feat(editor): EC-5.3 ssr safety`

#### M1-B-20 [TEST-RED] EC-7.5 PostEditor unchanged content commit

- [ ] 扩展 `PostEditor.test.tsx`：加载 fixture 后立即提交，断言 fetch payload content = fixture 字面
- [ ] FAIL
- commit: `test(editor): EC-7.5 unchanged content submit`

#### M1-B-21 [IMPL-GREEN] PostEditor 接通新 MarkdownEditor

- [ ] PostEditor 中 `<MarkdownEditorWithPreview>` 不变（外壳保留），内部接通新 source editor
- [ ] PASS
- commit: `feat(editor): EC-7.5 postEditor wired`

#### M1-B-22 [TEST-RED] EC-8.2 syntax highlight 轻染色

- [ ] MarkdownEditor.test.tsx 加 spec：heading 行有 bold class 或 token style
- [ ] FAIL
- commit: `test(editor): EC-8.2 syntax highlight`

#### M1-B-23 [IMPL-GREEN] CM6 markdown highlight 配置

- [ ] 加 `syntaxHighlighting(defaultHighlightStyle, { fallback: true })` 或自定义 minimal style
- [ ] PASS
- commit: `feat(editor): EC-8.2 syntax highlight`

#### M1-B-24 [TEST-RED] EC-8.3 light/dark theme 切换

- [ ] MarkdownEditor.test.tsx 加 spec：documentElement.classList.add("dark") 后 editor 背景 / 前景颜色变化
- [ ] FAIL
- commit: `test(editor): EC-8.3 theme toggle`

#### M1-B-25 [IMPL-GREEN] EditorView theme 跟 html class

- [ ] 自定义 theme extension，监听 documentElement class 变化用 `view.dispatch({ effects: themeCompartment.reconfigure(theme) })`
- [ ] PASS
- commit: `feat(editor): EC-8.3 theme toggle`

#### M1-B-26 [TEST-RED] EC-9.3 / EC-9.4 paste 行为

- [ ] MarkdownEditor.test.tsx 加 spec：paste HTML mime / markdown mime 都字面插入
- [ ] FAIL
- commit: `test(editor): EC-9.3 paste plain text`

#### M1-B-27 [IMPL-GREEN] paste handler

- [ ] CM6 默认行为已是 plain text；如有需要加 paste 自定义 handler
- [ ] PASS
- commit: `feat(editor): EC-9.3 paste plain text`

#### M1-B-28 [TEST-RED] EC-6.3 tiptap 残留检查

- [ ] 新建 `src/lib/editor/no-tiptap-residue.test.ts`（或 scripts/check）：grep `@tiptap\|prose-neutral` 在 src/、package.json
- [ ] FAIL（tiptap 还在 package.json）
- commit: `test(editor): EC-6.3 no tiptap residue`

#### M1-B-29 [IMPL-GREEN] 删 tiptap 依赖

- [ ] `pnpm remove @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-code-block-lowlight tiptap-markdown lowlight`
- [ ] 删 `src/components/editor/MarkdownEditor.tsx` 中所有 tiptap imports（已经替换为 CM6，应已 0 引用）
- [ ] PASS
- commit: `chore(editor): EC-6.3 remove tiptap deps`

#### M1-B-30 [TEST-RED] EC-7.1 PostEditor 既有测试不退化

- [ ] 跑 `pnpm test src/components/admin/posts/PostEditor.test.tsx`
- [ ] 如有 FAIL，调整 mock 方式（仍允许 mock 为 textarea 等效，但不允许弱化断言）
- commit: `test(editor): EC-7.1 PostEditor existing tests`

#### M1-B-31 [IMPL-GREEN] 调整 PostEditor 测试 mock

- [ ] mock `MarkdownEditorWithPreview` 仍可用 textarea 替身（保持现有测试通过）
- [ ] PASS
- commit: `feat(editor): EC-7.1 PostEditor mock adjustment`

**M1-B 出口检查**：

- [ ] `pnpm test` 全绿
- [ ] `pnpm typecheck` 绿
- [ ] `pnpm build` 绿，admin chunk gzip ≤ 90kB（EC-6.2）
- [ ] 浏览器手动验证 `/admin/posts/new` 与 `/admin/posts/[id]/edit`：左侧编辑区显示 markdown 字面、toolbar action 工作、ctrl+s 触发保存、tab 缩进
- [ ] grep `tiptap` 在 src + package.json 无残留（EC-6.3）

---

### 3.3 M1-C：编辑器预览一致性（spec EP-*）

#### M1-C-1 [TEST-RED] EP-1.3 / EP-1.4 预览 wrapper + 无水印

- [ ] 在新建 `src/components/editor/MarkdownEditorWithPreview.test.tsx`（重写）加 spec
- [ ] FAIL
- commit: `test(preview): EP-1.3 wrapper and no watermark`

#### M1-C-2 [IMPL-GREEN] 重写 preview wrapper

- [ ] 改 `MarkdownEditorWithPreview.tsx`：预览容器 `<article class="markdown-body max-w-none">` 不含 footnote 段
- [ ] PASS
- commit: `feat(preview): EP-1.3 wrapper and no watermark`

#### M1-C-3 [TEST-RED] EP-1.1 / EP-1.2 与发布态一致

- [ ] 新建 `src/components/editor/preview-parity.test.tsx`：fixture markdown → server `renderMarkdown` vs 客户端预览结果 → hash equal
- [ ] FAIL（mini-renderer 不可能一致）
- commit: `test(preview): EP-1.1 parity hash`

#### M1-C-4 [IMPL-GREEN] 预览改走完整管道

- [ ] `MarkdownLivePreview` 客户端组件：`dynamic import "@/lib/markdown"` + 调用 `renderMarkdown(value)` 后 setHtml + `dangerouslySetInnerHTML`
- [ ] 在 `MarkdownEditorWithPreview` 用 `MarkdownLivePreview` 替换 mini-renderer
- [ ] PASS
- commit: `feat(preview): EP-1.1 full pipeline`

#### M1-C-5 [TEST-RED] EP-2.1 debounce 200ms

- [ ] preview test 加 spec：vi.useFakeTimers + 模拟连续输入，断言 debounce 后才更新
- [ ] FAIL
- commit: `test(preview): EP-2.1 debounce`

#### M1-C-6 [IMPL-GREEN] debounce 200ms

- [ ] 在 `MarkdownLivePreview` 内用 useDeferredValue or useDebounce(200) 触发渲染
- [ ] PASS
- commit: `feat(preview): EP-2.1 debounce`

#### M1-C-7 [TEST-RED] EP-2.3 cancellation

- [ ] 加 spec：连续 5 次修改只渲染最后一次（spy on render count）
- [ ] FAIL
- commit: `test(preview): EP-2.3 cancellation`

#### M1-C-8 [IMPL-GREEN] AbortController

- [ ] debounce + 取消机制
- [ ] PASS
- commit: `feat(preview): EP-2.3 cancellation`

#### M1-C-9 [TEST-RED] EP-3.1 错误 banner

- [ ] preview test 加 spec：注入异常 markdown，断言 `<div role="alert">` 出现
- [ ] FAIL
- commit: `test(preview): EP-3.1 error banner`

#### M1-C-10 [IMPL-GREEN] try/catch + error banner

- [ ] MarkdownLivePreview try { renderMarkdown(value) } catch { setError(e) }
- [ ] PASS
- commit: `feat(preview): EP-3.1 error banner`

#### M1-C-11 [TEST-RED] EP-3.2 shiki unknown lang fallback

- [ ] `markdown.test.ts` 加 spec：` ```klingon ` 不抛错，降级 plain
- [ ] FAIL
- commit: `test(preview): EP-3.2 shiki fallback`

#### M1-C-12 [IMPL-GREEN] shiki try/catch

- [ ] visitor 内对 shiki 调用包 try/catch；fallback 输出 plain `<pre><code>`
- [ ] PASS
- commit: `feat(preview): EP-3.2 shiki fallback`

#### M1-C-13 [TEST-RED] EP-4.1 callout parity

- [x] preview-parity.test.tsx 加 spec：5 callout 类型 hash equal
- [x] FAIL or PASS（取决于 EP-1.1 已实施）
- commit: `test(preview): EP-4.1 callout parity`

#### M1-C-14 [IMPL-GREEN] 确认 PASS

- [x] 通常 EP-1.1 实施后 EP-4.1 自动 PASS；若不 PASS 调整
- commit: `feat(preview): EP-4.1 callout parity` *(若 PASS 可跳过)*

#### M1-C-15 [TEST-RED] EP-4.2 / EP-4.3 / EP-4.4 code block / table / blockquote / link parity

- [x] preview-parity.test.tsx 加 4 个 spec
- [x] FAIL or PASS
- commit: `test(preview): EP-4.2-4 visual parity`

#### M1-C-16 [IMPL-GREEN] 确认或微调

- [x] PASS
- commit: `feat(preview): EP-4.2-4 visual parity` *(若 PASS 可跳过)*

#### M1-C-17 [TEST-RED] EP-4.5 copy button in preview

- [x] preview test 加 spec：复制按钮也在预览内 + 点击 trigger
- [x] FAIL
- commit: `test(preview): EP-4.5 copy in preview`

#### M1-C-18 [IMPL-GREEN] MarkdownCopyButtons 复用

- [x] 在 MarkdownLivePreview 内 mount `<MarkdownCopyButtons />`
- [x] PASS
- commit: `feat(preview): EP-4.5 copy in preview`

#### M1-C-19 [TEST-RED] EP-5.3 listener cleanup

- [x] spec：mount/unmount cycle 后 listener count 0
- [x] FAIL or PASS
- commit: `test(preview): EP-5.3 listener cleanup`

#### M1-C-20 [IMPL-GREEN] useEffect cleanup

- [x] MarkdownCopyButtons useEffect 返回 cleanup function
- [x] PASS
- commit: `feat(preview): EP-5.3 listener cleanup`

#### M1-C-21 [TEST-RED] EP-7.1 现有 MarkdownPreview test 不退化

- [x] 跑 `pnpm test src/components/editor/MarkdownPreview.test.tsx`
- [x] 应 PASS
- commit: `test(preview): EP-7.1 existing tests` *(若 PASS 可作为 no-op)*

#### M1-C-22 [IMPL-GREEN] 删除 mini-renderer

- [x] `MarkdownEditorWithPreview.tsx` 删除 `miniRenderMarkdown` / `escapeHtml` / `applyInline` 函数
- [x] 删除 TODO 注释
- [x] PASS
- commit: `chore(preview): EP-7.2 remove mini-renderer`

**M1-C 出口检查**：

- [x] `pnpm test` 全绿
- [x] `pnpm build` 绿
- [x] 浏览器手动：在 `/admin/posts/new` 输入完整 fixture markdown，验证左右两侧 source + preview 完全符合契约 + 视觉与 `/posts/[slug]` 发布态一致
- [x] 截图归档（保存到 `.claude/sdd/public-ui-and-editor-overhaul/audit/editor-final.png`）

M1-C evidence (2026-05-23):

- `pnpm test`: 95 files / 529 passed / 1 skipped.
- `pnpm typecheck`: pass.
- `pnpm lint`: pass.
- `pnpm build`: pass.
- `rg "miniRenderMarkdown|function escapeHtml|function applyInline|tiptap|@tiptap|tiptap-markdown|lowlight|prose-neutral|prose-invert" src package.json pnpm-lock.yaml`: no output.
- Editor dynamic route diff gzip (`/admin/posts/new` minus `/admin`): 52.2 KiB, under EC-6.2 90 KiB limit.
- Browser audit screenshot: `audit/editor-final.png`.

---

## 4. M2 微循环任务

### 4.1 M2-A：admin token 与可读性（spec AR-*）

#### M2-A-1 [TEST-RED] AR-3.1 / AR-3.2 muted-fg 对比度

- [ ] 在 `globals.test.ts` 加对比度 spec（光照 helper 已在 M1-A-3 建立）
- [ ] FAIL
- commit: `test(admin): AR-3 muted-fg contrast`

#### M2-A-2 [IMPL-GREEN] 调整 muted-fg token

- [ ] `globals.css` `:root` `--muted-fg: 220 13% 36%;`；`.dark` `--muted-fg: 240 5% 70%;`
- [ ] 加 `--muted-fg-strong`、`--surface-subtle`、`--surface-raised`、`--ring-soft` 等 design-notes §2.1 token
- [ ] PASS
- commit: `feat(admin): AR-3 muted-fg contrast`

#### M2-A-3 [TEST-RED] AR-1.1 / AR-1.2 sidebar 用 AdminSidebar + 删 link

- [ ] 新建 / 扩展 `src/app/(admin)/admin/layout.test.tsx`：断言 layout 含 `<AdminSidebar>` 组件 + NAV_ITEMS 不含 analytics/settings
- [ ] FAIL（当前 layout 内联，且含两条死链）
- commit: `test(admin): AR-1 sidebar component + clean nav`

#### M2-A-4 [IMPL-GREEN] AR-1.1 / AR-1.2 layout 用 AdminSidebar

- [ ] 把 layout.tsx 内联 aside 改为 `<AdminSidebar />`
- [ ] `AdminSidebar.tsx` 中 NAV_ITEMS 删 analytics / settings
- [ ] PASS
- commit: `feat(admin): AR-1 sidebar component + clean nav`

#### M2-A-5 [TEST-RED] AR-1.3 nav href 存在性

- [ ] `AdminSidebar.test.tsx` 加 spec：每个 href 对应 file 存在（fs.existsSync helper）
- [ ] FAIL or PASS
- commit: `test(admin): AR-1.3 nav existence`

#### M2-A-6 [IMPL-GREEN] AR-1.3 fs helper + 确认

- [ ] 加 test helper（不入 prod）
- [ ] PASS
- commit: `feat(admin): AR-1.3 nav existence`

#### M2-A-7 [TEST-RED] AR-2.1 / AR-2.2 / AR-2.3 active state

- [ ] `AdminSidebar.test.tsx` 加 3 个 spec（mock usePathname）
- [ ] FAIL
- commit: `test(admin): AR-2 active state`

#### M2-A-8 [IMPL-GREEN] AR-2 active 实现

- [ ] AdminSidebar 用 `usePathname()` + startsWith 计算 `data-active`
- [ ] CSS 加 `[data-active="true"]` 样式（design-notes §2.1 token）
- [ ] PASS
- commit: `feat(admin): AR-2 active state`

#### M2-A-9 [TEST-RED] AR-5.1 / AR-5.2 status badge token

- [ ] `globals.test.ts` 加 4 个 status token spec + 对比度
- [ ] `CommentsTable.test.tsx` 扩展：断言 Badge 不含 hardcoded class
- [ ] FAIL
- commit: `test(admin): AR-5 status badge tokens`

#### M2-A-10 [IMPL-GREEN] AR-5 status badge token + CommentsTable

- [ ] `globals.css` 加 `--status-pending-*` / `-approved-*` / `-spam-*` / `-rejected-*` token（light + dark）
- [ ] `CommentsTable.tsx` Badge 改 token-driven（用 data-status + CSS 或 style prop）
- [ ] PASS
- commit: `feat(admin): AR-5 status badge tokens`

#### M2-A-11 [TEST-RED] AR-6.1 / AR-6.2 / AR-6.3 表格 zebra + th + 圆角

- [ ] `globals.test.ts` + `PostsTable.test.tsx` + `ColumnsTable.test.tsx` + `CommentsTable.test.tsx` 加 spec
- [ ] FAIL
- commit: `test(admin): AR-6 table styles`

#### M2-A-12 [IMPL-GREEN] AR-6 表格样式

- [ ] `globals.css` 加 `.admin-table` 系列
- [ ] 各 admin 表格容器加 `admin-table` class（或同等 mechanism）
- [ ] PASS
- commit: `feat(admin): AR-6 table styles`

#### M2-A-13 [TEST-RED] AR-6.4 PostsFilters Reset

- [ ] `PostsFilters.test.tsx` 加 spec：filters 激活时显示 Reset 按钮
- [ ] FAIL
- commit: `test(admin): AR-6.4 reset button`

#### M2-A-14 [IMPL-GREEN] AR-6.4 Reset 按钮

- [ ] `PostsFilters.tsx` 加 Reset 按钮 + 点击清空所有 query params
- [ ] PASS
- commit: `feat(admin): AR-6.4 reset button`

#### M2-A-15 [TEST-RED] AR-8.1 EmptyState 组件

- [ ] 新建 `src/components/admin/EmptyState.test.tsx`
- [ ] FAIL
- commit: `test(admin): AR-8 EmptyState`

#### M2-A-16 [IMPL-GREEN] AR-8.1 EmptyState 实现

- [ ] 新建 `src/components/admin/EmptyState.tsx`
- [ ] PASS
- commit: `feat(admin): AR-8 EmptyState`

#### M2-A-17 [TEST-RED] AR-8.2 各 list page 用 EmptyState

- [ ] 扩展各 list test：断言空时渲染 EmptyState
- [ ] FAIL
- commit: `test(admin): AR-8.2 list pages use EmptyState`

#### M2-A-18 [IMPL-GREEN] PostsTable / CommentsTable / ColumnsTable / MediaPage 用 EmptyState

- [ ] 替换各空状态片段
- [ ] PASS
- commit: `feat(admin): AR-8.2 list pages use EmptyState`

#### M2-A-19 [TEST-RED] AR-7.1 / AR-7.2 header breadcrumb + dropdown（可选 / 推荐做）

- [ ] 新建 `src/components/admin/AdminHeader.test.tsx`
- [ ] FAIL
- commit: `test(admin): AR-7 header upgrades`

#### M2-A-20 [IMPL-GREEN] AdminHeader 实现

- [ ] 新建 `src/components/admin/AdminHeader.tsx`：breadcrumb（usePathname 解析）+ DropdownMenu trigger（shadcn）
- [ ] layout.tsx 引用 `<AdminHeader>`
- [ ] PASS
- commit: `feat(admin): AR-7 header upgrades`

#### M2-A-21 [TEST-RED] AR-4 button / form helper / focus 统一

- [ ] grep / visual spec
- [ ] FAIL or PASS
- commit: `test(admin): AR-4 buttons forms focus`

#### M2-A-22 [IMPL-GREEN] AR-4 微调

- [ ] 各 admin 页 button class 用 shadcn variant；form helper / error text 用 muted-fg / destructive
- [ ] PASS
- commit: `feat(admin): AR-4 buttons forms focus`

**M2-A 出口检查**：

- [ ] `pnpm test` 全绿
- [ ] 浏览器手动审查所有 admin 页面 light + dark mode；按 `browser-audit-checklist.md` 填表

---

### 4.2 M2-B：首页重做（spec H-*）

> 顺序：先建 primitives + content data → 各子组件 → page.tsx 重组 → 测试。

#### M2-B-1 [TEST-RED] H-2.1 / H-2.2 / H-2.3 / H-2.4 HomeHero

- [ ] 新建 `src/components/site/HomeHero.test.tsx`：4 个 spec
- [ ] FAIL
- commit: `test(home): H-2 HomeHero`

#### M2-B-2 [IMPL-GREEN] HomeHero 实现

- [ ] 新建 `src/components/site/HomeHero.tsx`：eyebrow + h1 + lede + dual CTA + Now badge + reveal classes
- [ ] `globals.css` 加 dot-grid / grain noise CSS
- [ ] PASS
- commit: `feat(home): H-2 HomeHero`

#### M2-B-3 [TEST-RED] H-5.1 / H-5.2 HomePrinciples

- [ ] 新建 `src/components/site/HomePrinciples.test.tsx`
- [ ] 新建 `src/lib/content/principles.test.ts`（共享 source data 测试）
- [ ] FAIL
- commit: `test(home): H-5 HomePrinciples`

#### M2-B-4 [IMPL-GREEN] HomePrinciples + 数据

- [ ] 新建 `src/lib/content/principles.ts`（含 8 条 principle，主 4 标记 isFeatured）
- [ ] 新建 `src/components/site/HomePrinciples.tsx`：取 isFeatured=true 的 4 条
- [ ] PASS
- commit: `feat(home): H-5 HomePrinciples`

#### M2-B-5 [TEST-RED] H-4 HomeColumns

- [ ] 新建 `src/components/site/HomeColumns.test.tsx`
- [ ] FAIL
- commit: `test(home): H-4 HomeColumns`

#### M2-B-6 [IMPL-GREEN] HomeColumns

- [ ] 新建 `src/components/site/HomeColumns.tsx`：listColumns + cards
- [ ] PASS
- commit: `feat(home): H-4 HomeColumns`

#### M2-B-7 [TEST-RED] H-3 HomeFeaturedAndRecent

- [ ] 新建 `src/components/site/HomeFeaturedAndRecent.test.tsx`
- [ ] FAIL
- commit: `test(home): H-3 HomeFeaturedAndRecent`

#### M2-B-8 [IMPL-GREEN] HomeFeaturedAndRecent

- [ ] 新建 `src/components/site/HomeFeaturedAndRecent.tsx`：拿 listPosts({ pageSize: 8 }) 拆 1 featured + 7 recent
- [ ] PASS
- commit: `feat(home): H-3 HomeFeaturedAndRecent`

#### M2-B-9 [TEST-RED] H-8 HomeStats

- [ ] 新建 `src/components/site/HomeStats.test.tsx`
- [ ] FAIL
- commit: `test(home): H-8 HomeStats`

#### M2-B-10 [IMPL-GREEN] HomeStats

- [ ] 新建 `src/components/site/HomeStats.tsx`：mono 单行
- [ ] 如需扩 `getSiteStats()` 加 lastShipped 字段，同步扩展（一对 service test commit）
- [ ] PASS
- commit: `feat(home): H-8 HomeStats`

#### M2-B-11 [TEST-RED] H-6 TechStack 升级

- [ ] 新建 / 扩展 `src/components/site/TechStack.test.tsx`
- [ ] FAIL
- commit: `test(home): H-6 TechStack upgrade`

#### M2-B-12 [IMPL-GREEN] TechStack rationale + 链接

- [ ] 新建 `src/lib/content/tech-stack.ts`（统一 source）
- [ ] 改 `src/components/site/TechStack.tsx`：从 content 取，每项加 rationale tooltip，末尾链接到 about#tech-stack
- [ ] PASS
- commit: `feat(home): H-6 TechStack upgrade`

#### M2-B-13 [TEST-RED] H-7 GithubCard 视觉与 fallback

- [ ] 扩展 `GithubCard.test.tsx`
- [ ] FAIL
- commit: `test(home): H-7 GithubCard upgrade`

#### M2-B-14 [IMPL-GREEN] GithubCard 微调

- [ ] 容器套 launch-panel；fallback 文案中文化
- [ ] PASS
- commit: `feat(home): H-7 GithubCard upgrade`

#### M2-B-15 [TEST-RED] H-1.1 / H-1.2 / H-9.1 / H-9.2 page.tsx 重组 + 一致化

- [ ] 大改 `src/app/(site)/page.test.tsx`：断言 7 section DOM 顺序、删 LaunchNarrative 引用、文案中文化
- [ ] FAIL
- commit: `test(home): H-1 H-9 page composition`

#### M2-B-16 [IMPL-GREEN] page.tsx 重组

- [ ] 重写 `src/app/(site)/page.tsx`：HomeHero / HomeFeaturedAndRecent / HomeColumns / HomePrinciples / TechStack / GithubCard / HomeStats 7 段
- [ ] 删除 LaunchNarrative import
- [ ] 文案统一中文（H-9）
- [ ] PASS
- commit: `feat(home): H-1 H-9 page composition`

**M2-B 出口检查**：

- [ ] `pnpm test` 全绿
- [ ] 浏览器审查 `/` light + dark + 空文章状态

---

### 4.3 M2-C：About 重做（spec A-*）

> 顺序与 M2-B 类似。

#### M2-C-1..N（共 ~22 微循环，依 spec A-1 - A-12 列出）

逐 spec 写微循环对（test + feat）。具体顺序：

- A-2 AboutHero 升级（1 pair）
- A-3 AboutNow 扩展（1 pair）+ `about.ts` 数据扩展（1 pair）
- A-4 AboutProjectIntent 新建（1 pair）
- A-5 AboutTechStack 新建 + `tech-stack.ts` 已在 M2-B-12 建立（仅组件 pair）
- A-6 AboutImplementationApproach 新建（1 pair）
- A-7 AboutPrinciples 扩展（1 pair；用 M2-B-4 数据）
- A-8 AboutFutureRoadmap 新建 + i18n disclosure（1 pair）
- A-9 AboutContact 微调（1 pair）
- A-1 page.tsx 重组 8 段 + 文案（1 pair）

每条遵循 commit 模式：

- `test(about): A-X.Y <description>`
- `feat(about): A-X.Y <description>`

**M2-C 出口检查**：

- [ ] `pnpm test` 全绿
- [ ] 浏览器审查 `/about` light + dark
- [ ] 验证 `/about#tech-stack` 锚跳转工作

---

## 5. M3 微循环任务

### 5.1 M3-A：未完成页面盘点与死链清理（spec IP-*）

> 大部分 IP spec 在 M2-A AR-1 / AR-2 已实施；本段做最终检查。

#### M3-A-1 [TEST-RED] IP-2.1 + IP-5.2

- [ ] `AdminSidebar.test.tsx` 加最终 spec：grep NAV_ITEMS 无 "analytics" / "settings" / "_editor-demo"
- [ ] FAIL or PASS
- commit: `test(nav): IP-5 sidebar nav final check`

#### M3-A-2 [IMPL-GREEN] PASS 确认

- [ ] 如已 PASS 跳过；否则补
- commit: `feat(nav): IP-5 final` *(可跳过)*

#### M3-A-3 [docs] IP-3.2 `_editor-demo` 加 PoC banner

- [ ] 在 `src/app/(admin)/admin/_editor-demo/page.tsx` 顶部加 banner "Editor PoC sandbox — not part of production"
- [ ] commit: `docs(admin): IP-3.2 editor demo banner [no-tdd]`

#### M3-A-4 [docs] 内部链接 sweep（可选）

- [ ] grep `<Link href=` 列表交叉对照 `find page.tsx`
- [ ] 修任何 404 死链
- [ ] commit: `chore(nav): IP-2.2 link sweep [no-tdd]`

---

### 5.2 M3-B：i18n 现状审计文档同步（spec I18N-*）

> 文档已写好；本段确认与代码一致 + UI 文案一致化 + 显式声明落地。

#### M3-B-1 [TEST-RED] I18N-2.1 AboutFutureRoadmap i18n 声明

- [ ] `AboutFutureRoadmap.test.tsx` 加 spec：断言含 "中文单语言" / "V3" 字符
- [ ] FAIL（M2-C 已实施时应已 PASS；此为确认）
- commit: `test(i18n-docs): I18N-2 about disclosure`

#### M3-B-2 [IMPL-GREEN] PASS

- [ ] 确认 PASS
- commit: `feat(i18n-docs): I18N-2 about disclosure` *(可跳过)*

#### M3-B-3 [docs] I18N-2.2 README 加单语声明

- [ ] 改 `README.md`，加单语声明段
- [ ] commit: `docs(i18n-docs): I18N-2.2 readme disclosure [no-tdd]`

#### M3-B-4 [docs] I18N-2.3 sitemap / robots 注释

- [ ] 改 `src/app/sitemap.ts` + `src/app/robots.ts` 顶部 JSDoc
- [ ] commit: `docs(i18n-docs): I18N-2.3 sitemap robots comments [no-tdd]`

#### M3-B-5 [TEST-RED] I18N-3.1 / I18N-3.2 / I18N-3.3 不允许假装

- [ ] `SiteHeader.test.tsx` 加 spec：no language switcher
- [ ] `posts/[slug]/page.test.tsx` 加 spec：metadata.alternates.languages 不设
- [ ] grep next-intl 等
- [ ] FAIL or PASS
- commit: `test(i18n-docs): I18N-3 no fake i18n`

#### M3-B-6 [IMPL-GREEN] 确认 / 修正

- [ ] PASS
- commit: `feat(i18n-docs): I18N-3 no fake i18n` *(可跳过)*

#### M3-B-7 [docs] I18N-4.2 memory-bank progress.md 加 V3 slug

- [ ] `memory-bank/progress.md` V3 段加 `i18n-locale-routing-v3` slug
- [ ] commit: `docs(i18n-docs): I18N-4.2 progress v3 slug [no-tdd]`

---

### 5.3 M3-C：浏览器逐页审查

> 按 `browser-audit-checklist.md` 12 路由 × 5 维度逐项。每发现一个缺陷写 issue-log 一行。

#### M3-C-1 浏览器审查 light mode

- [ ] 跑 `pnpm dev`
- [ ] 按 checklist 走完 12 路由 light mode
- [ ] 截图归档到 `audit/light/{route}-light.png`
- [ ] issue-log 记录每个缺陷

#### M3-C-2 浏览器审查 dark mode

- [ ] 切 dark
- [ ] 按 checklist 走完 12 路由 dark mode
- [ ] 截图归档到 `audit/dark/{route}-dark.png`
- [ ] issue-log 记录缺陷

#### M3-C-3 修正发现的缺陷

- [ ] 每个 issue 走小型 TDD 微循环（commit pair）
- [ ] 重新跑 audit 直到清单全绿

#### M3-C-4 截图与 issue-log 归档

- [ ] 把所有 audit/ 文件夹与 issue-log.md 提交
- [ ] commit: `docs(audit): M3-C browser audit final [no-tdd]`

---

### 5.4 M3-D：完整 build + 性能 + 归档

#### M3-D-1 全量验收

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] 全绿
- [ ] commit: 无（仅检查）

#### M3-D-2 性能 / chunk size 复核

- [ ] 比较 `pnpm build` 输出 admin chunk vs P-4 基线
- [ ] 应该满足 EC-6.2 ≤ 90 kB
- [ ] 若不达标，做 chunk 分析 + 优化

#### M3-D-3 写 completion-report.md

- [ ] 新建 `.claude/sdd/public-ui-and-editor-overhaul/completion-report.md`
- [ ] 内容：本轮完成项清单、关键决策回顾、与 spec 偏离记录、未做项归属、测试基线变化、build 输出对比、浏览器审查截图链接
- [ ] commit: `docs(public-ui-and-editor-overhaul): completion report [no-tdd]`

#### M3-D-4 memory-bank 同步

- [ ] 更新 `memory-bank/activeContext.md` 当前焦点：本轮完成
- [ ] 更新 `memory-bank/progress.md` 已完成段 + V2 / V3 backlog 同步
- [ ] 更新 `memory-bank/knownIssues.md` 关闭 / 维持的 issue
- [ ] 更新 `memory-bank/systemPatterns.md` §13 (markdown pipeline) + §14 (编辑器契约) 按实际更新
- [ ] commit: `docs(memory): sync after public-ui-and-editor-overhaul [no-tdd]`

#### M3-D-5 SDD 归档

- [ ] `git mv .claude/sdd/public-ui-and-editor-overhaul .claude/sdd/archive/YYYY-MM-DD-public-ui-and-editor-overhaul`
- [ ] commit: `chore(sdd): archive public-ui-and-editor-overhaul [no-tdd]`

#### M3-D-6 PR / 交付给 ha1den

- [ ] 推分支 + 开 PR（如需要）
- [ ] PR description 引用 completion-report.md
- [ ] 等 ha1den 复审

---

## 6. 出口标准（总）

所有 milestone 完成后必须全部满足：

| 检查项 | 要求 |
|---|---|
| `pnpm typecheck` | 绿 |
| `pnpm lint` | 绿（zero warning） |
| `pnpm test` | 绿（通过数 ≥ 基线 + 100 spec） |
| `pnpm build` | 绿 |
| Admin chunk gzip | ≤ 90 kB |
| 浏览器审查 light + dark 12 路由 | 完整截图 + issue-log 清空 |
| memory-bank 同步 | activeContext / progress / knownIssues / systemPatterns 更新 |
| README 含单语声明 | grep "single-locale" |
| AboutFutureRoadmap 含 i18n 声明 | grep "中文单语言" |
| `_editor-demo` 含 banner | grep "PoC sandbox" |
| sidebar 无 analytics/settings/_editor-demo link | grep AdminSidebar.tsx |
| no tiptap residue | grep 无 |
| no mini-renderer residue | grep `miniRenderMarkdown` 无 |
| completion-report.md 存在 | 自检 |

---

## 7. 微循环数与时间预算（最终）

| Milestone | 微循环对数（est） | 预计工时 |
|---|---|---|
| M1-A markdown-reading | 22 pairs | 8-10h |
| M1-B editor-source-contract | 16 pairs | 10-12h |
| M1-C editor-preview-parity | 11 pairs | 4-6h |
| M2-A admin-readability | 11 pairs | 5-7h |
| M2-B home-redesign | 8 pairs | 5-7h |
| M2-C about-redesign | 9 pairs | 4-6h |
| M3-A incomplete-pages-inventory | 2 pairs + 2 docs | 1-2h |
| M3-B i18n-current-state-audit | 3 pairs + 3 docs | 1-2h |
| M3-C browser audit | — | 3-4h |
| M3-D archival | — | 1-2h |
| **合计** | **~82 pairs + ~6 docs** | **42-58h** |

按 1 commit pair / 25 分钟工作量算，一个开发日 ~16 pair；总计约 5-6 个开发日（不含 dead time）。

---

## 8. 中断恢复

如果实施中途中断（session 结束 / 系统重启）：

1. 跑 `git log --oneline -30` 看最近 commit 落到哪条 spec-id
2. 比对本表，找到该 spec-id 后的下一个 micro-cycle
3. 跑 `pnpm test` 确认前序 commit 状态绿
4. 继续

不允许跳过未完成的 spec 提前进入下一个 milestone。
