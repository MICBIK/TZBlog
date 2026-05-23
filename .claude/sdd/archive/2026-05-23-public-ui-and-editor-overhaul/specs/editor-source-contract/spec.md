# Spec — editor-source-contract

> Capability：恢复 Markdown 编辑器的"源码契约"——左侧编辑区显示原始 markdown 字符。
> 范围：替换 Tiptap + tiptap-markdown 为 CodeMirror 6；toolbar、placeholder、quirks 全部重写。
> 上游：`design-notes.md §4`、`design-research.md §4`、`memory-bank/systemPatterns.md §14`。
> 不动：右侧预览管道（spec EP-*）、PostEditor 容器（仅 props 不变）、保存 / 加载 / API contract。

---

## EC-1 源码可见性（核心契约）

### EC-1.1 编辑区显示原始 markdown 字符串

**GIVEN** 用户在 `/admin/posts/new` 打开编辑器
**WHEN** 在左侧编辑区输入 `## 标题` 后回车再输入 `**粗体**` 后回车再输入 `> [!NOTE]\n注意事项`
**THEN** 编辑区屏幕显示的**字面字符**是 `## 标题`（不是大字号标题）、`**粗体**`（不是粗体文字）、`> [!NOTE]\n注意事项`（不是 callout 渲染）；选中并复制时复制到剪贴板的也是这些原始字符。

### EC-1.2 编辑区不应用 prose / markdown-body 类

**GIVEN** 编辑区组件 mount
**WHEN** DOM 查询
**THEN** 编辑区 root 元素的 className **不**包含 `prose`、`prose-neutral`、`prose-invert`、`markdown-body` 任意一个；CodeMirror DOM 标识 `cm-editor` 出现；CodeMirror 的 `.cm-line` 元素显示文本字面而非 rendered HTML。

### EC-1.3 toolbar action 在光标位置插入字符

**GIVEN** 用户在编辑区光标处
**WHEN** 点击 toolbar 的 "Bold" 按钮
**THEN** 在光标处插入 `**` 并选中插入位置；如果选中了文本 X，则替换为 `**X**`；toolbar 不调用 Tiptap commands；toolbar 不修改 CodeMirror schema。

---

## EC-2 加载 round-trip 一致性

### EC-2.1 编辑已有文章字面一致回填

**GIVEN** 数据库 `PostTranslation.content` 为：
```
## 标题

正文段 1。

- item 1
- item 2

> [!WARNING]
> 警告内容

```ts
const x = 1;
```

普通段。
```
**WHEN** 用户访问 `/admin/posts/[id]/edit`
**THEN** 编辑器左侧显示的字符串与上述 DB content **字面相同**（包括所有换行、缩进、空行、code fence 标记）；不允许 `> [!WARNING]` 被改写成 `>WARNING:`、不允许 list 风格从 `-` 变成 `*`、不允许 code fence 内容被序列化重排。

### EC-2.2 编辑保存 round-trip

**GIVEN** 用户加载已有文章 X，content 是 markdown 字符串 S
**WHEN** 用户**不做任何编辑**直接点 "Save Draft"
**THEN** 提交给后端的 `translations[0].content` 与 S **字面相同**；DB 在 update 后 content 仍为 S（没有 noop diff 也没有格式化漂移）。

### EC-2.3 保存后再加载仍一致

**GIVEN** 用户编辑文章 X 加入了一段新 markdown M（如 `\n\n## 新段` ）
**WHEN** 保存成功后立即重新加载页面
**THEN** 编辑器显示 `S + M` 字面值；再次保存 不会产生 diff。

---

## EC-3 toolbar 行为

### EC-3.1 toolbar 按钮集合

**GIVEN** toolbar 渲染
**WHEN** 用户查看可用按钮
**THEN** 至少包含：Bold (⌘B)、Italic (⌘I)、Code (⌘E)、H2 (⌘⌥2)、H3 (⌘⌥3)、UL (⌘⇧8)、OL (⌘⇧7)、Quote、Code Block、Link (⌘K)、Image、Table、Callout (NOTE)；每个按钮 `title` 含中文标签 + shortcut；toolbar 上没有指向 Tiptap 私有 API 的按钮（如 "切换富文本模式"）。

### EC-3.2 Bold 按钮包裹选中

**GIVEN** 编辑区当前 `value="hello world"`，用户选中 "world"
**WHEN** 点击 Bold 按钮
**THEN** value 变成 `"hello **world**"`；onChange 触发一次；选区保留在 "world"（光标用户可继续编辑）。

### EC-3.3 H2 按钮在行首插入 `## `

**GIVEN** 编辑区 `value="hello"`，光标在 "hello" 中
**WHEN** 点击 H2 按钮
**THEN** value 变成 `"## hello"`；光标位置保留在原字符索引偏移后；onChange 触发一次。

### EC-3.4 Code Block 按钮插入三个反引号 fence

**GIVEN** 编辑区光标在空行
**WHEN** 点击 Code Block 按钮
**THEN** 在光标位置插入 ` ```\n\n``` `（三反引号、回车、空行、回车、三反引号），光标定位在中间空行；选中文本时被包裹在 fence 内。

### EC-3.5 Callout 按钮插入 GH-alert 语法

**GIVEN** 编辑区光标
**WHEN** 点击 Callout 按钮（默认 NOTE，可点旁边小三角切其它类型）
**THEN** 在光标位置插入 `> [!NOTE]\n> 内容` 并选中 "内容" 子串；切其它类型时插入对应 `> [!TIP]` / `> [!IMPORTANT]` / `> [!WARNING]` / `> [!CAUTION]`。

### EC-3.6 Link 按钮弹 dialog 还是 inline 插入

**GIVEN** 用户选中文本 "click here"
**WHEN** 点击 Link 按钮
**THEN** 选项 A：弹 dialog 询问 URL（推荐）然后包裹为 `[click here](url)`；选项 B：直接插入 `[click here](url)` 让用户改 url。执行方选 A，单 dialog 复用 shadcn Dialog。

### EC-3.7 Image 按钮接媒体库

**GIVEN** 用户点 Image 按钮
**WHEN** 弹出媒体选择 dialog
**THEN** 列表从 `/api/admin/media` 拉；用户选中一张图后在编辑区光标插入 `![alt](url)`，url 是媒体 row 的 `Media.url` 字段；不允许直接传 base64 / blob。

---

## EC-4 编辑器 quirks（输入体验）

### EC-4.1 tab 缩进 2 空格

**GIVEN** 编辑区
**WHEN** 用户按 Tab
**THEN** 插入 2 个空格（默认 CM6 配置 indentUnit="  "）；shift+tab 在行首去 2 空格；选中多行时整体缩进 / 反缩进。

### EC-4.2 markdown 语法 keymap

**GIVEN** CodeMirror with `@codemirror/lang-markdown`
**WHEN** 用户输入 `# title` 后回车
**THEN** 不允许自动转换为 `## ` 或 rich-text；保持原字符。lang-markdown 默认只提供语法染色不改写文本。

### EC-4.3 list continuation

**GIVEN** 用户在 `- item 1` 行末按回车
**WHEN** 默认行为
**THEN** 新行自动插入 `- `（list continuation）；如果用户在空 `- ` 行按回车，删除该 list marker（退出列表）。CM6 markdown extension 自带此行为，验证启用。

### EC-4.4 行号显示

**GIVEN** 编辑区任意状态
**WHEN** 渲染
**THEN** 左侧显示行号（CM6 `lineNumbers()` extension）；行号字体 mono、色 muted-fg；不允许行号占用编辑区宽度过多（gutter ~3rem）。

### EC-4.5 placeholder 显示

**GIVEN** 编辑区 value 为空字符串
**WHEN** 渲染
**THEN** 编辑区中央或第一行显示 placeholder（如"在这里写 Markdown..."），半透明；用户开始输入时立即消失；placeholder 不出现在 value（不污染 onChange）。

### EC-4.6 ctrl/cmd+s 保存

**GIVEN** 编辑器 mount，父组件 `PostEditor` 提供 `onSave` callback
**WHEN** 用户按 ctrl/cmd+s
**THEN** preventDefault 阻止浏览器保存对话框 + 调用 `onSave`（即触发 "Save Draft" 行为）；toast 显示保存中 / 成功 / 失败。

### EC-4.7 自动配对（可选）

**GIVEN** 用户输入 `[`
**WHEN** 默认配对启用
**THEN** 自动补 `]` 并光标置中（CM6 `closeBrackets()` extension）；同理 `(` `[` `**`；用户可关（不强制，但 spec 要求**默认启用**）。

---

## EC-5 性能与稳定性

### EC-5.1 加载长文档无卡顿

**GIVEN** 一篇 10,000 字符的 markdown
**WHEN** 编辑器 mount
**THEN** TTI（编辑器可输入）≤ 500ms（基于本地 dev）；输入响应 ≤ 16ms（一帧）；scroll 滚动流畅（无掉帧）。

### EC-5.2 内存不泄漏

**GIVEN** 用户连续打开 / 关闭编辑器 10 次（不刷新页面）
**WHEN** 每次都用 dynamic import 加载 CM6
**THEN** chunk 只下载一次（cache hit）；EditorView destroy 调用，旧 view 不残留（chrome devtools heap snapshot 验证 — implementation 自检）。

### EC-5.3 SSR 安全

**GIVEN** `/admin/posts/new` 是 server component 包裹
**WHEN** Next.js 服务端渲染
**THEN** 编辑器组件用 `"use client"` 标记 + dynamic import；服务端不尝试创建 EditorView（CM6 需要 DOM）；不出现 hydration mismatch warning。

---

## EC-6 依赖与体积

### EC-6.1 依赖增减

**GIVEN** 当前 `package.json` 依赖 `@tiptap/react/starter-kit/extension-link/extension-image/extension-code-block-lowlight/tiptap-markdown/lowlight`
**WHEN** 实施完本 spec
**THEN** package.json 中**删除**上述所有 tiptap-* / tiptap-markdown / lowlight；**新增** `codemirror@^6` + `@codemirror/state` + `@codemirror/view` + `@codemirror/lang-markdown` + `@codemirror/language` + `@codemirror/commands` + `@codemirror/search`；执行 `pnpm install` 后 lockfile diff 干净（无残留 tiptap）。

### EC-6.2 admin chunk 体积

**GIVEN** `pnpm build` 输出
**WHEN** 检查 admin chunk size（含编辑器）
**THEN** 编辑器 chunk gzip ≤ 90 kB（CM6 主要 + lang-markdown + 配套）；首屏 admin 路由（`/admin`、`/admin/posts`）不加载编辑器 chunk（dynamic import）。

### EC-6.3 tiptap 残留检查

**GIVEN** 实施完本 spec 后
**WHEN** `grep -r "tiptap\|prose-neutral\|prose-invert\|@tiptap" src/ package.json`
**THEN** 没有任何匹配项（不包括 README / docs 历史描述）。

---

## EC-7 现有测试与新测试

### EC-7.1 PostEditor 现有测试通过

**GIVEN** `src/components/admin/posts/PostEditor.test.tsx` 现有 7 specs（create+publish 跳转 / 草稿 PATCH / title 空 / slug 非法 / CONFLICT toast / 网络错误 / mode 差异）
**WHEN** 实施完本 spec
**THEN** 测试更新对编辑器的 mock 方式（现有 mock 是 `<textarea>`，可保留；改成 stub 一个 CM6-like component 也可），所有 7 spec 通过；不允许"修改测试以掩盖 contract 违反"。

### EC-7.2 新增 MarkdownEditor 单元测试

**GIVEN** 新 `src/components/editor/MarkdownEditor.tsx` 用 CodeMirror 6
**WHEN** 单元测试覆盖
**THEN** 至少以下场景被 RED→GREEN：
- 初始 value 渲染为 cm-content 文本
- onChange 在用户输入时被触发，参数是当前 markdown 字符串
- value prop 外部变化时编辑器内容同步
- toolbar Bold 按钮点击插入 `**...**`
- toolbar Callout 按钮点击插入 `> [!NOTE]\n> `
- placeholder 在 value 为空时显示
- tab 键插入 2 空格

### EC-7.3 round-trip 测试

**GIVEN** 一组测试 markdown 字符串（含 callout / code fence / nested list / 中文 / HTML inline）
**WHEN** 把字符串作为 value 注入编辑器，再 onChange 取出
**THEN** 取出字符串与注入字符串字面相同（包括所有空行、缩进、特殊字符）；至少 5 个测试 case 覆盖不同语法。

### EC-7.4 toolbar action 集成测试

**GIVEN** `MarkdownEditorWithPreview` mount
**WHEN** 用户点击 toolbar Bold / Italic / Code / H2 / Callout 按钮
**THEN** 每个 action 后 onChange 被调用，新 markdown 包含期望字符；jsdom 通过 RTL 模拟点击。

### EC-7.5 加载 round-trip 集成测试

**GIVEN** 测试通过 mock 加载一篇文章 `initial.content` 为复杂 markdown
**WHEN** 编辑器 mount 完成 + 立即 mock "Save Draft" 调用
**THEN** 提交给 fetch 的 payload `content` 与 `initial.content` 字面相同。

---

## EC-8 视觉规格（与 admin-readability 联动）

### EC-8.1 编辑区视觉

**GIVEN** 编辑器渲染
**WHEN** 默认状态
**THEN** 字体 `var(--font-mono)`、字号 `var(--text-base)`、行高 `1.65`；行号 gutter 用 `--muted-fg`；selection 背景用 `hsl(var(--accent) / 0.18)`；focus 时 outline 用 `--ring`。

### EC-8.2 syntax 染色

**GIVEN** 编辑器内有 markdown 语法
**WHEN** CM6 lang-markdown 染色
**THEN** heading 字体 bold + 颜色微强；inline code 背景 muted-bg；code fence 块状背景；list marker 颜色 muted-fg；link / image syntax 颜色 accent。**轻度**染色即可，不要让编辑区看起来像 rendered 文档（违反 EC-1.1）。

### EC-8.3 light/dark mode 切换

**GIVEN** `<html>` class 变化
**WHEN** 编辑器实例存在
**THEN** 编辑器主题随之切换（background / 文字色 / selection 色）；如果用 `@codemirror/theme-one-dark` 则按 prefers-color-scheme 切；或自写 CSS variable theme（推荐）。

### EC-8.4 toolbar 视觉与 admin token 一致

**GIVEN** toolbar
**WHEN** 渲染
**THEN** toolbar 高度 ~40px；按钮 hover 状态用 `hsl(var(--muted))`；active toolbar 按钮（如选中 code 块时 Code 按钮）用 `hsl(var(--accent))` 边框或背景区分；icons 用内联 SVG（与项目 token 一致）。

---

## EC-9 失败 / 边缘 case 处理

### EC-9.1 浏览器 clipboard API 拒绝

**GIVEN** 用户在 HTTP（非 HTTPS）环境
**WHEN** copy 按钮失败
**THEN** 显示 toast.error；不允许 silent failure。

### EC-9.2 极端长行（10000 字符不换行）

**GIVEN** value 中有一行 10000 字符
**WHEN** 编辑器渲染
**THEN** CM6 自动 word-wrap（默认开启），不出现横向滚动条 / DOM 卡顿。

### EC-9.3 paste 富文本

**GIVEN** 用户从浏览器复制 rich HTML 粘贴
**WHEN** 粘贴进编辑器
**THEN** 编辑器**只**接收 plain text 字符（CM6 默认行为）；不解析 HTML、不转 markdown；用户得到的字符就是 clipboard 的 plain text 表示。

### EC-9.4 paste markdown

**GIVEN** 用户从 markdown 文件复制
**WHEN** 粘贴
**THEN** 字面原样插入；不重新格式化。

### EC-9.5 大量删除性能

**GIVEN** 用户选中整篇文章 ctrl+a 后 delete
**WHEN** 操作完成
**THEN** ≤ 50ms；onChange 被触发一次（debounce 不允许吞掉）。
