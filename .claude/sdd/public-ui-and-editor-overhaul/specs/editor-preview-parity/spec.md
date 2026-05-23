# Spec — editor-preview-parity

> Capability：右侧预览与发布态视觉 / DOM **完全一致**。
> 范围：`MarkdownEditorWithPreview` 内右侧预览管道替换 + parity 验证。
> 上游：`design-notes.md §5`、`design-research.md §4-§7`、`markdown-reading` spec MR-*。
> 不动：源码编辑器（spec EC-*）、发布态详情页（已有）。

---

## EP-1 预览管道与发布态一致

### EP-1.1 预览渲染走完整管道

**GIVEN** 当前 `MarkdownEditorWithPreview.tsx:128` 用 mini-renderer
**WHEN** 实施后
**THEN** 预览不再调用 `miniRenderMarkdown`；预览走 `renderMarkdown`（与 `src/lib/markdown.ts` 完全相同的 unified+remark+rehype+shiki 管道）；预览的 HTML 输出 byte 级或 hash 级**等同**于发布态详情页对同样 content 的输出。

### EP-1.2 预览 HTML hash 测试

**GIVEN** 一个测试 markdown 字符串 S
**WHEN** 服务端 `renderMarkdown(S)` 与客户端预览渲染（实施后）分别输出 HTML
**THEN** 两者 `crypto.subtle.digest("SHA-256", ...)` 相同；不允许 client/server 输出存在差异（例如 client 缺 callout transform）。

### EP-1.3 预览 wrapper 与发布态一致

**GIVEN** 预览容器
**WHEN** 渲染
**THEN** 容器 className 为 `markdown-body max-w-none`（与详情页 `posts/[slug]/page.tsx:122` 一致）；DOM 中没有额外的 wrapper class 影响样式；没有 `prose` 残留。

### EP-1.4 预览不显示 "preview-only" 水印 chrome

**GIVEN** 用户在编辑器
**WHEN** 查看预览面板
**THEN** 不存在"This is a preview"水印 banner；当前 `MarkdownEditorWithPreview.tsx:75-79` 的小字 footnote 被删除（用户已经知道这是预览）。

---

## EP-2 预览延迟与性能

### EP-2.1 debounce

**GIVEN** 用户连续输入字符（每秒 5 字符）
**WHEN** 预览管道处理
**THEN** debounce 200ms（design-notes §5.2）；输入停止 200ms 后预览刷新；输入期间不重算（除非用户停顿）。

### EP-2.2 长文档性能

**GIVEN** 编辑器 value 是 10,000 字符 markdown（含 callout / code block / table）
**WHEN** 用户输入一个新字符
**THEN** 200ms debounce 后预览刷新；主线程不阻塞 > 100ms；UI 不掉帧。

### EP-2.3 cancellation

**GIVEN** 用户在 200ms 内连续 5 次修改
**WHEN** debounce 触发
**THEN** 只渲染最后一次；中间渲染请求被 abort（避免老结果覆盖新结果）。

### EP-2.4 Web Worker（可选 / 优选）

**GIVEN** unified pipeline 比较 CPU-bound
**WHEN** 实施 EP-2.2 性能不达标
**THEN** 把 markdown→html 放 web worker（`new Worker(new URL("./markdown-worker", import.meta.url), { type: "module" })`）；主线程接收 string 结果用 `dangerouslySetInnerHTML` 渲染。如果 EP-2.2 在不开 worker 时已达标则**不**引入 worker（YAGNI）。

---

## EP-3 错误状态

### EP-3.1 markdown 解析失败显示错误

**GIVEN** value 是恶意 / 异常 markdown（如未闭合的 code fence）
**WHEN** unified pipeline 抛错
**THEN** 预览面板顶部显示 banner（red bg + 错误信息 + 行号 hint），下方仍尝试显示部分渲染结果或上次成功结果（取实施方便）；不允许预览面板"空白"或"卡死"。

### EP-3.2 shiki 高亮失败降级

**GIVEN** code block 语言是 shiki 未加载的语言（如 `klingon`）
**WHEN** shiki throws
**THEN** code block 降级为 plain `<pre><code>` 无高亮；不阻断整篇预览；console 不打 error（warning 可）。

### EP-3.3 sanitize 拒绝时降级

**GIVEN** value 含恶意 HTML（`<script>alert(1)</script>`）
**WHEN** rehype-sanitize 处理
**THEN** 恶意元素被剥离；预览正常显示其余内容；no XSS。

---

## EP-4 视觉 parity 详细验证

### EP-4.1 callout 五分类视觉一致

**GIVEN** value 包含 `> [!NOTE]`、`> [!TIP]`、`> [!IMPORTANT]`、`> [!WARNING]`、`> [!CAUTION]` 各一段
**WHEN** 预览渲染
**THEN** 每个 callout 视觉与发布态详情页**逐像素**等价（DOM 结构、class、token 值、icon path 完全相同）；执行方在本 spec 实施时拍截图对比 `/admin/posts/new` 预览 vs `/posts/[slug]` 发布态。

### EP-4.2 code block chrome 视觉一致

**GIVEN** value 含 ` ```ts title="src/foo.ts" const x = 1; ``` `
**WHEN** 预览渲染
**THEN** chrome bar 出现：语言徽章 + filename + 复制按钮；shiki 高亮 token 颜色与发布态相同；light/dark mode 切换时双方同步。

### EP-4.3 table / list / blockquote 视觉一致

**GIVEN** value 包含 table、nested list、multi-paragraph blockquote
**WHEN** 预览渲染
**THEN** zebra / th / 缩进 / italic 等所有视觉行为与发布态一致。

### EP-4.4 链接 hover 视觉一致

**GIVEN** value 含链接
**WHEN** hover
**THEN** 预览中链接 hover 视觉（颜色 + 背景 + underline）与发布态一致。

### EP-4.5 复制按钮在预览中也工作

**GIVEN** 预览中有 code block
**WHEN** 用户点 chrome bar 的复制按钮
**THEN** 复制成功；toast 显示；行为与发布态一致。

---

## EP-5 客户端集成

### EP-5.1 `renderMarkdown` 是 isomorphic

**GIVEN** `src/lib/markdown.ts` 当前用于服务端
**WHEN** 客户端引入
**THEN** 函数本身 isomorphic（unified / remark / rehype / shiki / 自定义 visitor 全部支持 client）；不需要重写；不需要 server-only 标记。

### EP-5.2 客户端 bundle 含 markdown 管道

**GIVEN** 预览面板用 `dynamic import` 拉取 markdown 管道
**WHEN** 用户首次进入编辑器
**THEN** 拉取的 chunk 含 unified + remark + rehype + shiki + 自定义 visitor；该 chunk 不阻塞 PostEditor 的其它部分；admin 首屏（`/admin`）不加载此 chunk。

### EP-5.3 client-side hydration 守住 copy button

**GIVEN** 服务端渲染输出的 markdown 含 `<button data-copy>...`，hydration 后客户端要绑定 onClick
**WHEN** `MarkdownCopyButtons` 在预览容器内运行
**THEN** 通过 `useEffect` + `querySelectorAll('[data-copy]')` 一次性绑定；预览刷新（value 变化重渲染）时旧 listener 清理；不允许 listener 堆积。

---

## EP-6 测试覆盖

### EP-6.1 parity hash 测试

**GIVEN** 一组测试 markdown fixture（含所有语法）
**WHEN** 调用 server-side `renderMarkdown(fixture)` 与 client-side (经过 mock 或真实 Worker) 渲染
**THEN** 两者输出 HTML 字符串相等（或归一化空格 / line ending 后相等）。

### EP-6.2 预览刷新测试

**GIVEN** `MarkdownEditorWithPreview` 渲染
**WHEN** value prop 变化 + debounce 触发
**THEN** preview DOM 在 200ms 后更新；旧 listener 清理；新 click 复制按钮触发新 handler。

### EP-6.3 错误 banner 测试

**GIVEN** value 含解析异常
**WHEN** 预览管道抛错
**THEN** 预览面板顶部有 `<div role="alert">` 显示错误；下方不空白。

### EP-6.4 性能测试

**GIVEN** value 10,000 字符
**WHEN** 触发预览渲染
**THEN** 整个渲染 ≤ 500ms（包括 markdown parse + shiki + DOM 注入）；如不达标降级 Web Worker（EP-2.4）。

---

## EP-7 现有测试不退化

### EP-7.1 `MarkdownPreview.test.tsx` 通过

**GIVEN** 现有 `src/components/editor/MarkdownPreview.test.tsx`
**WHEN** 本 spec 实施
**THEN** 测试断言 `.markdown-body` 存在 + 无 `.prose` 仍然通过；测试中的 fixture 字符串如有需要扩展加入 callout / code fence / table。

### EP-7.2 mini-renderer 移除后无回归

**GIVEN** `miniRenderMarkdown` 函数与依赖
**WHEN** 删除该函数
**THEN** 全量测试通过；无 import 残留；删除 commit 是单独的 chore commit。
