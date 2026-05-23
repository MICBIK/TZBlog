# Proposal — creative-blog-notion-editor

## 背景

当前 TZBlog 的前台界面已经完成基础发布能力，但主观效果仍偏模板化；后台编辑器仍以 CodeMirror Markdown source editor 为核心，写作体验与用户期望的 Notion-like block editor 有差距。

本 feature 接受一个新的产品方向：**放弃“编辑区永远显示 Markdown 原文”的硬约束**，转向更接近 Notion 的所见即所得 block editing，但后端仍优先保持 Markdown 字符串作为存储格式，除非 POC 证明 Markdown round-trip 代价不可接受。

## 推荐方向

采用混合设计路线：

- 首页与文章索引借鉴 Firefly / Fuwari / idealclover 的结构密度和个人信息聚合。
- 整体视觉与微交互借鉴 Rauno / Maggie Appleton / Braydon Coyer 的克制细节。
- 文章详情借鉴 Maxime Heckel / samwho / Nicky Case 的 interactive technical writing。
- 动效 pattern 借鉴 Codrops，但只作为局部素材库，不把 TZBlog 做成重型动效 showcase。
- 编辑器采用 Notion-like block editor 路线，先 POC Novel/Tiptap 与 MDXEditor，必要时把 Milkdown 作为第三候选。

## 目标

1. 后台文章编辑器支持 Notion-like block editing：slash command、bubble menu、块级图片/代码/引用/列表/表格插入。
2. 编辑器保存时输出可发布的 Markdown，发布态仍复用 `renderMarkdown` 管道。
3. 前台首页从“模板 landing page”转为“个人技术花园”：身份、文章、项目、状态、社交数据、最近内容自然聚合。
4. 文章列表与标签/专栏页具备更好的信息密度、过滤反馈和动效层次。
5. 文章详情页提升为 creative technical article：阅读进度、TOC、callout/code/table、可选 interactive explainer block。
6. 建立统一 motion system：轻量、可测试、尊重 `prefers-reduced-motion`。

## 非目标

- 不做完整主题 GUI。
- 不做多语言 V3 route migration。
- 不把所有文章都改成重型交互文章；interactive block 是能力，不是默认强制。
- 不引入第三方 CMS。
- 不把 Markdown 存储立刻替换成 JSON block schema，除非 POC 结论明确要求单开后续 SDD。

## 影响范围

- `src/components/editor/*`
- `src/components/admin/posts/PostEditor.tsx`
- `src/app/(admin)/admin/posts/*`
- `src/components/site/*`
- `src/app/(site)/page.tsx`
- `src/app/(site)/posts/page.tsx`
- `src/app/(site)/posts/[slug]/page.tsx`
- `src/app/(site)/tags/page.tsx`
- `src/app/(site)/columns/page.tsx`
- `src/app/globals.css`
- `src/lib/markdown.ts`
- `memory-bank/systemPatterns.md`（实现完成后需要同步编辑器契约）

## 决策门

实现前必须先完成 editor POC micro-cycle：

1. 复杂 Markdown fixture round-trip：heading、bold/italic、code fence、table、image、blockquote、GH alert、inline HTML、中文内容。
2. 保存 payload 仍满足 `src/lib/schemas/post.ts` 的 Markdown content contract。
3. 发布态 HTML 仍由 `renderMarkdown` 生成。
4. 如果 Novel/Tiptap 不能稳定 Markdown round-trip，则降级评估 MDXEditor。
5. 如果 MDXEditor 的交互不够 Notion-like，但 round-trip 明显更安全，优先保留 Markdown 正确性，再局部补 slash command / toolbar 体验。

## 验收标准

- 编辑器候选选择有真实 POC 证据，不靠主观判断。
- 所有行为变更按 test-map 进行 RED/GREEN。
- 前台页面 light/dark、desktop/mobile 均完成 browser screenshot smoke。
- 动效不影响可访问性：reduced motion 下无大幅移动、无持续循环动画。
- `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` 全绿。

