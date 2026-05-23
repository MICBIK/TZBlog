# Design Notes — creative-blog-notion-editor

## 1. 设计定位

TZBlog 下一版不再追求“干净但普通”的博客模板，而是做成一个有个人气质的 creative technical garden：

- **内容骨架**：技术博客、项目、状态、社交数据、个人叙事都要可见。
- **阅读体验**：文章详情仍以长文阅读为主，但允许局部 interactive explainer。
- **动效尺度**：页面进入、hover、TOC、card、筛选、文章 block 用微交互；不做全站高成本 3D 叙事。
- **后台体验**：写作应接近 Notion：先写内容，再考虑 Markdown；Markdown 是存储/发布格式，不再是编辑器唯一可见形态。

## 2. 参考拆解

### Firefly / Fuwari

- 可借：双侧栏/右侧 rail、文章卡片密度、主题色、页面转场、搜索、归档、TOC、相关文章。
- 不借：过量按钮、音乐播放器优先级、强 ACG/壁纸氛围。
- 对 TZBlog 的落点：文章列表、首页内容 rail、全站动效系统。

### idealclover

- 可借：左侧身份卡 + 右侧内容流，社交数据、项目、博客文章聚合。
- 不借：过可爱的字体、过强的圆角/玻璃质感。
- 对 TZBlog 的落点：首页首屏从 hero 改成“身份 + 内容工作台”。

### inspurer / Awesome-Blog 中文生态

- 可借：分类、标签、归档、阅读时长、评论数、站点统计的完整信息组织。
- 不借：旧 Hexo 主题的视觉语言和过密导航。
- 对 TZBlog 的落点：文章索引的信息密度和元信息展示。

### Maxime Heckel / samwho / Nicky Case

- 可借：复杂技术概念用图形、交互、阶段化解释，而不是只靠段落和代码。
- 不借：每篇文章都定制大工程；TZBlog 先做少量 reusable explainer block。
- 对 TZBlog 的落点：文章详情页支持 interactive explainer section。

### Rauno / Maggie Appleton / Braydon Coyer

- 可借：克制布局、细节 hover、个人气质、内容分类、不是模板感的首页。
- 不借：只服务作品集的布局；TZBlog 首要仍是写作与阅读。
- 对 TZBlog 的落点：首页气质、导航、micro-interaction。

### Codrops

- 可借：局部 motion pattern、hover reveal、scroll transition、creative card layout。
- 不借：整站变成动效 demo；不把读者阅读路径打散。
- 对 TZBlog 的落点：motion inspiration library。

## 3. 编辑器候选策略

### Candidate A — Novel / Tiptap

优点：

- 交互最接近 Notion。
- slash command、bubble menu、floating menu、block extension 生态成熟。
- 更适合“写作时不看 Markdown 源码”的体验。

风险：

- Markdown import/export 可能规范化内容。
- GH alert、Shiki code meta、复杂 table、inline HTML 需要自定义 extension。
- 可能需要把编辑器内部态与 Markdown 存储之间做 adapter。

### Candidate B — MDXEditor

优点：

- 明确以 Markdown string 作为输入输出。
- 对 Markdown 持久化更友好。
- 工具栏、lists、tables、code blocks、directives 等能力较完整。

风险：

- Notion-like 程度弱于 Novel/Tiptap。
- 需要额外实现或定制 slash command 体验。

### Candidate C — Milkdown

优点：

- Markdown-first WYSIWYG，底层 ProseMirror + remark。
- Typora-like 体验成熟。

风险：

- 不如 Novel/Tiptap 像 Notion。
- 项目集成复杂度和主题定制需要单独验证。

## 4. 编辑器决策规则

优先级：

1. Markdown 保存正确性。
2. Notion-like 写作体验。
3. 与现有 `renderMarkdown` 发布管道兼容。
4. 依赖体积和维护成本。

决策方式：

- 先写 round-trip contract test。
- 再接候选 editor adapter。
- 如果 Candidate A 无法通过核心 fixture，转 Candidate B。
- 如果 Candidate B 体验明显达不到目标，再评估 Candidate C。

## 5. 前台布局原则

- 首页避免传统大 hero 卡片堆叠；首屏采用 identity rail + content stream。
- 卡片用于 repeated items，不把整个 section 包成卡片。
- 文章列表要能快速扫描：标题、摘要、标签、日期、阅读时长、评论/浏览/点赞。
- About 不是 marketing 页面，而是个人 narrative + project intent。
- 文章详情保持 max readable width，但允许右侧 sticky TOC / related / metadata rail。
- 移动端优先保证内容顺序，不强行保留桌面 rail。

## 6. Motion 原则

- 统一 motion tokens：duration、easing、distance、stagger。
- 动效只承担三种作用：状态反馈、信息层级、空间转场。
- hover 使用小位移、opacity、border/highlight，不使用大幅缩放。
- scroll reveal 不遮挡正文，不影响首屏可读。
- `prefers-reduced-motion: reduce` 下关闭页面转场、stagger、持续循环动画。

## 7. 后续需要同步的项目规则

实现完成后必须更新 `memory-bank/systemPatterns.md §14`：

- 从 “CodeMirror source editor + split preview” 改为 “Notion-like block editor with Markdown persistence”。
- 明确 Markdown 仍是 API/storage wire format。
- 明确 editor 内部状态可以不是 Markdown source，但保存和发布必须通过 adapter contract。

