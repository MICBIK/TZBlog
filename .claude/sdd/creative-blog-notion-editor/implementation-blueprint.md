# Implementation Blueprint — creative-blog-notion-editor

## 0. 当前结论

本 feature 不是“把现在的界面换一套 CSS”，而是一次产品形态调整：

1. **前台**：从普通博客模板改成 creative technical garden。
2. **后台**：从 Markdown source editor 改成 Notion-like block editor。
3. **存储**：优先继续使用 Markdown string；只有 POC 证明不可行时，才单开 SDD 讨论 JSON/block schema。
4. **动效**：必须有，但只服务导航、层级、状态反馈和技术解释；不做整站重型动画。

## 1. 参考来源映射

| Reference | 主要价值 | 借鉴范围 | 明确不借 |
|-----------|----------|----------|----------|
| Firefly / Fuwari | 高密度博客 layout、导航、主题、转场、搜索、TOC、相关文章 | 文章索引、侧边 rail、主题/动效系统 | 音乐播放器优先级、过多入口、强 ACG/壁纸氛围 |
| idealclover | 个人身份卡 + 内容流 + 多平台数据聚合 | 首页首屏、项目/社交数据模块 | 可爱字体、大圆角玻璃感 |
| Awesome-Blog / inspurer | 中文博客生态的信息组织完整度 | 标签、归档、分类、阅读时长、评论/访问统计 | 旧 Hexo 视觉、过密导航 |
| Rauno | 微交互、hover、页面质感、克制空间 | 导航、button/card focus、页面转场 | 极简到信息不足 |
| Maggie Appleton | digital garden 分类和个人叙事 | 首页 IA、About、内容类型分类 | 手绘/插画风格照搬 |
| Maxime Heckel | 技术文章互动演示、深色质感 | 文章详情、interactive explainer | 每篇都定制 3D/Shader |
| samwho | 技术解释可视化，动画服务理解 | 文章内 step visual、静态 fallback | 过度 emoji/插图风格 |
| Nicky Case | 互动解释和人格化表达 | 局部 interactive block | 游戏化全站 |
| Codrops | 动效 pattern library | hover reveal、scroll transition、card motion | 把站点变成 demo 集 |
| Braydon Coyer | blogfolio 的模块完整度 | 首页模块组合、项目展示 | 过度炫技和 decorative clutter |

## 2. 视觉方向

### 2.1 目标气质

- 不是 SaaS dashboard。
- 不是纯文本极简博客。
- 不是二次元主题站。
- 不是作品集炫技站。

目标是：**冷静、技术、个人、有一点实验感**。

### 2.2 页面密度

- 首页：中高密度，首屏必须同时看到身份、状态、最新内容、项目入口。
- 文章列表：高密度，可快速扫描，不做大图瀑布流。
- 文章详情：低到中密度，正文优先，右侧 rail 只做辅助。
- 后台编辑器：低噪音，类似 Notion 文档编辑区，metadata 侧栏保持工具属性。

### 2.3 视觉 token 原则

- 保持当前 CSS variable 体系，不引入硬编码色板。
- 减少“整块浮卡 section”；cards 只用于 repeated items。
- 主色调不走单一紫蓝/深蓝，不走大面积 beige，不走玻璃拟态。
- 用 typography、spacing、border、motion 建立层次。

## 3. 首页 Blueprint

### 3.1 Desktop layout

`>= 1180px`：

```text
┌──────────────────────────────────────────────────────────────┐
│ Header: compact nav + theme + search                         │
├───────────────┬───────────────────────────────┬──────────────┤
│ Identity Rail │ Content Stream                │ Context Rail  │
│ 280-320px     │ minmax(0, 1fr), max 760-820px │ 240-280px     │
│               │                               │              │
│ - avatar/name │ - current focus / now         │ - stats       │
│ - one-liner   │ - featured post               │ - tags        │
│ - status      │ - recent posts                │ - links       │
│ - social      │ - projects                    │ - timeline    │
│ - stack chips │ - writing collections         │              │
└───────────────┴───────────────────────────────┴──────────────┘
```

`Context Rail` 不是必需首屏强制存在；如果实现成本高，第一阶段只做 `Identity Rail + Content Stream`。

### 3.2 Mobile layout

`< 768px`：

```text
Header
Profile Summary
Current Focus
Featured Post
Recent Posts
Projects
Collections / Tags
Stats
Footer
```

移动端不保留三栏；所有 rail 内容按优先级折叠为普通 section。

### 3.3 模块优先级

P0：

- Identity card：姓名、定位、短描述、状态。
- Current focus：当前在做什么，来自静态 content 或 `memory-bank` 映射后手动维护。
- Featured post：优先显示最新/置顶文章。
- Recent posts：3-5 篇。
- Projects：3 个以内。

P1：

- GitHub data card。
- Site stats。
- Popular tags。
- Now timeline。

延后：

- 复杂时间线。
- 外部平台实时粉丝数。
- 自定义主题 GUI。

### 3.4 首页不可接受状态

- 首屏只是一句大标题。
- 每个模块都是等权 card，导致没有视觉主次。
- 只有 dark mode 好看，light mode 发灰。
- hover 动效让布局跳动。

## 4. 文章索引 Blueprint

### 4.1 `/posts`

目标：像 Firefly/Fuwari 的信息密度，但视觉上更克制。

Desktop:

```text
┌─────────────────────────────────────────────┬───────────────┐
│ Post Index                                  │ Filter Rail    │
│ - page title + count                        │ - search       │
│ - active filter chips                       │ - tags         │
│ - dense post list                           │ - columns      │
│   title / excerpt / tags / date / stats     │ - archive      │
└─────────────────────────────────────────────┴───────────────┘
```

Mobile:

- Filter rail 变成顶部 horizontal chips + search input。
- post card 不强制封面图。

### 4.2 Card structure

每条文章：

- title
- excerpt
- date
- reading time
- column
- tags
- view / like / comment count
- optional cover thumbnail

### 4.3 Filters

本 feature 不一定一次做完高级过滤，但结构要预留：

- `q`
- `tag`
- `column`
- `year`

URL query 是 SSOT，刷新可恢复。

## 5. 文章详情 Blueprint

### 5.1 Desktop layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Article Header                                               │
│ title / excerpt / metadata / cover                           │
├────────────────────────────────────────────┬─────────────────┤
│ Article Body                               │ Sticky Rail      │
│ max 720-780px                              │ - TOC            │
│ markdown-body                              │ - progress       │
│ interactive blocks                         │ - related        │
│ comments / likes                           │                 │
└────────────────────────────────────────────┴─────────────────┘
```

### 5.2 Interactive explainer block

第一阶段只做一个 reusable component，不做文章级 DSL：

- 静态 fallback：截图/diagram/文本步骤。
- JS enhanced：SVG/canvas/slider/stepper。
- Markdown 插入方式暂定为 HTML comment marker 或 fenced directive，需在 `notion-editor-002` 后确定。

候选语法：

```markdown
:::interactive key="hash-table-demo"
fallback="哈希表插入过程示意"
:::
```

如果编辑器候选不支持 directive，则先作为 React component 手工嵌入指定文章，进入后续 SDD。

### 5.3 Article page no-go

- 右侧 rail 抢正文宽度。
- 互动组件没有静态 fallback。
- 代码块、callout、table 视觉和预览不一致。
- TOC 更新导致 layout shift。

## 6. About Blueprint

About 不是“再写一个个人简介页面”，而是承接 Maggie/idealclover：

- Why this site exists
- What I build
- What I write about
- Current focus
- Stack and constraints
- Contact / links

不做：

- marketing hero
- 过长履历
- 与首页完全重复的模块

## 7. Admin Editor Blueprint

### 7.1 编辑器目标

用户体验接近 Notion：

- 空行输入 `/` 打开 command menu。
- 选中文本出现 bubble menu。
- block 支持 paragraph、h2/h3、blockquote、code、image、table、callout、list。
- 保存输出 Markdown。
- 预览可以从常驻右侧变成可切换 preview sheet / split mode。

### 7.2 PostEditor layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Sticky top bar: breadcrumb / status / save / publish         │
├────────────────────────────────────────────┬─────────────────┤
│ Document editor                            │ Metadata rail    │
│ title input                                │ slug             │
│ excerpt                                    │ cover            │
│ Notion-like blocks                         │ tags/column      │
│ floating/bubble/slash UI                   │ status/date      │
└────────────────────────────────────────────┴─────────────────┘
```

### 7.3 Candidate evaluation

必须用同一套 fixture 测：

- heading
- bold / italic / inline code
- link
- image
- blockquote
- ordered/unordered list
- table
- code fence with language and filename/meta
- GH alert
- inline HTML / kbd
- Chinese punctuation and blank lines

判定：

- `markdownImportExport = pass`：导出 Markdown 保留语义，允许有限 normalization。
- `renderMarkdownParity = pass`：导出 Markdown 经 `renderMarkdown` 后与原 fixture HTML 等价。
- `unsupportedMarkdownFeatures = []`：P0 发布必要语法无缺失。

### 7.4 候选顺序

1. Novel/Tiptap：优先体验。
2. MDXEditor：优先 Markdown 安全。
3. Milkdown：补位评估。

执行规则：

- 如果 Novel/Tiptap 在 `notion-editor-002` 失败，不强行补过多 custom extension，转 MDXEditor。
- 如果 MDXEditor 通过但体验不够 Notion-like，先接受 MDXEditor，再用 wrapper 做 slash menu / bubble affordance。
- 不允许直接引入 block JSON 存储。

## 8. Motion System Blueprint

### 8.1 Tokens

建议先建 `src/lib/motionTokens.ts` 或 CSS custom properties：

```ts
duration: {
  fast: 120,
  base: 180,
  slow: 320,
}
distance: {
  xs: 2,
  sm: 6,
  md: 12,
}
easing: {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
}
```

### 8.2 Allowed patterns

- card hover: translateY(-2px), border accent, shadow subtle。
- nav active: underline/indicator slide。
- page enter: opacity + y(8px)，只对非正文容器。
- filter change: chip state + list fade, no full layout jump。
- article progress: scaleX transform。

### 8.3 Disallowed patterns

- 永久循环大动画。
- scroll hijacking。
- 大面积 blur/orbs/blob 背景。
- hover 触发大幅 card resize。
- 首屏内容初始 hidden，JS 未加载时不可见。

## 9. Component Inventory

### Public

- `HomeGarden`
- `IdentityRail`
- `CurrentFocus`
- `FeaturedPostPanel`
- `RecentPostStream`
- `ProjectShowcase`
- `ContextRail`
- `DensePostCard`
- `PostDiscoveryFilters`
- `ArticleShell`
- `ArticleRightRail`
- `ReadingProgress`
- `InteractiveExplainer`

### Editor

- `NotionMarkdownEditor`
- `notionEditorAdapter`
- `notionEditorFixture`
- `SlashCommandMenu`
- `BubbleFormatMenu`
- `EditorPreviewSheet`

### Motion

- `motionTokens`
- `useReducedMotion`
- CSS utility classes for reveal/focus/card hover

## 10. Execution Order

### Phase 0 — Blueprint freeze

Current step. No app code except already-created minimal `notionEditorAdapter` gate.

Deliverables:

- this blueprint
- decision matrix
- screenshot matrix

### Phase 1 — Editor POC

Goal: choose editor engine with evidence.

Order:

1. `notion-editor-002`: complex fixture round-trip.
2. small dependency install only after test demands it.
3. compare Novel/Tiptap and MDXEditor.
4. update design notes with selected candidate.

Stop if:

- no candidate preserves publish-critical Markdown.
- selected candidate requires schema/storage change.

### Phase 2 — Editor shell

Goal: replace admin post editor surface.

Order:

1. slash command.
2. bubble menu.
3. image/media insertion.
4. PostEditor save integration.

### Phase 3 — Public shell redesign

Goal: home/posts/article visual system.

Order:

1. motion tokens first.
2. homepage identity rail + content stream.
3. dense posts index.
4. article shell and right rail.
5. interactive explainer minimal component.

### Phase 4 — Smoke and polish

Goal: visual verification.

Run:

- desktop/mobile screenshots
- light/dark screenshots
- `prefers-reduced-motion`
- editor create/edit smoke
- full quality gate

## 11. Screenshot Matrix

| Route | Desktop Light | Desktop Dark | Mobile Light | Mobile Dark | Notes |
|-------|---------------|--------------|--------------|-------------|-------|
| `/` | required | required | required | required | identity rail collapse |
| `/posts` | required | required | required | required | dense cards + filters |
| `/posts/[slug]` | required | required | required | required | article rail + markdown |
| `/tags` | required | optional | required | optional | discovery consistency |
| `/columns` | required | optional | required | optional | discovery consistency |
| `/about` | required | required | required | required | personal narrative |
| `/admin/posts/new` | required | required | required | required | editor create |
| `/admin/posts/[id]/edit` | required | required | optional | optional | editor round-trip |

## 12. Quality Gates

Every implementation phase:

- targeted Vitest PASS
- `pnpm typecheck`
- `pnpm lint`

Feature finish:

- `pnpm test`
- `pnpm build`
- browser screenshots
- memory-bank update
- systemPatterns editor contract update

## 13. Open Questions

1. 首页是否保留英文 copy，还是统一中文个人站语气？
2. `CurrentFocus` 数据源是静态 content，还是后台 SiteConfig？
3. 是否需要“置顶文章/精选文章”字段？如果需要 DB schema，必须单独确认。
4. Interactive explainer 的内容输入方式是否进入本 feature，还是先只做前端组件能力？
5. Notion-like editor 如果选择 MDXEditor，是否接受“体验不像 Novel 但更稳”的 tradeoff？

## 14. 当前推荐

先做 **Phase 1 editor POC**，理由：

- 编辑器会影响依赖、bundle、PostEditor 布局、Markdown contract。
- 如果 editor 选型需要改存储，前台文章体验也会受影响。
- 先确定内容生产端，再重做展示端，风险更低。

但 Phase 1 只做到候选选择和最小 editor shell，不一次性替换所有交互。

