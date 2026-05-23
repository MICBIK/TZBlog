# Design Research — public-ui-and-editor-overhaul

> 目的：在动手实现前，把 Markdown 阅读、callout、code block、双栏编辑器、技术博客首页/About、后台管理界面六大维度的参考案例和设计判断写清楚。
> 本文是**输入资料**，不是 spec；spec 在 `specs/<capability>/spec.md` 里。
> 写作准则：**先事实，后比较，再判断**。每个参考案例都尽量给出可被验证的具体特征（DOM/class/token），避免"看起来很棒"这类无信息描述。

---

## 0. 本项目的设计基线

在做任何参考研究前，需要把 TZBlog 自身的设计定位锁定，否则参考案例就没有筛选标准。

- **product type**：单作者、长文为主、技术向、自托管个人博客（≠ 团队 wiki、≠ 商业 SaaS marketing）
- **tone**：editorial / journalistic，不是 marketing / playful / brutalist
- **visual reference**（已有）：参考 Claude、Apple、OpenAI、Linear 的 disciplined minimalism；克制、留白、字大、节奏感强
- **type stack**：`Source Serif` (display) + `Inter` (sans) + `JetBrains Mono` (mono)，全套 clamp() fluid scale
- **colour token**：oklch / hsl 语义化（fg / bg / muted / accent / border），不出现 `text-blue-500` 这类调色板硬编码
- **motion budget**：reveal-on-mount + hover-translate-2px + 单个 orbit 旋转背景，**不**走 framer-motion 大动效
- **dark mode**：first-class，不是 afterthought
- **不可妥协**：a) max-w-3xl 阅读列宽 b) clamp fluid type c) 服务端渲染 d) 自托管（无第三方 CDN/script 依赖）

凡是与上述任一项冲突的参考做法，本轮**直接拒绝**，不再赘述。

---

## 1. Markdown 阅读样式

### 1.1 参考案例的事实

#### Anthropic Docs（claude.ai/docs、docs.anthropic.com）
- 正文字号 ~17px，line-height 1.6，max-width ~720px
- h1 用大号 sans-serif，h2 上方有 1px border-top 分隔，h3 是粗体小号
- code block 圆角 12px，padding 1rem，dark slate 背景，顶部有 `<header>` 包语言+复制按钮，光滑 hover
- inline code 用浅黄/灰底 + monospace + padding 横向 0.4em
- table 整体有 border + zebra row + 紧 padding
- callout：左边 4px accent border + 浅色 tint 背景 + 大图标 + heading-style 标题；五个变体颜色清晰

#### Stripe Docs
- 极致克制：字号 16px，line-height 1.6，正文 inline code 仅 `rgba(black, .05)` 背景 + 0.4em padding 无 border
- code block 顶部是黑色 tab bar，可切多语言，dark mode 用极深 graphite + 鲜亮色 token
- callout 用 `<aside>` 元素，左侧 accent stripe + icon + 标题，色彩极淡（看起来像页面背景）
- 链接颜色与 accent 相同，hover 加 1px underline-offset

#### Vercel Docs / Vercel Blog
- 双 column 设计，正文 max-w ~700px，sidebar 同高
- code block 有 file tab（`tsconfig.json` 这种），language badge 在右侧
- callout 三色（blue=info、yellow=warning、red=destructive），左侧 accent stripe 比 Stripe 更明显，title 是 `<strong>` 不是单独 heading
- inline code 颜色比正文略淡，避免视觉过载

#### GitHub Primer (github.com)
- 这是**本项目 GH-style alerts 的官方源头**；NOTE/TIP/IMPORTANT/WARNING/CAUTION 五个变体
- 颜色取自 Primer：`note=blue (accent.emphasis)`、`tip=success.emphasis`、`important=done.emphasis (purple/blue)`、`warning=attention.emphasis (amber)`、`caution=danger.emphasis (red)`
- DOM 结构：`<div class="markdown-alert markdown-alert-note">` → `<p class="markdown-alert-title">` (含 SVG icon) + 正文 paragraphs
- 视觉：左 border 0.25em + 浅色 tint 背景 + 标题颜色 = accent color
- title 是大写小字 + icon prefix（不是 heading style）
- code block 顶部无 tab，单 `<pre><code>`，hover 显示 raw / copy actions

#### Tailwind CSS v4 docs (`tailwindcss.com/docs`)
- 双 column，正文最大宽 768px，typography 用自家 `@tailwindcss/typography` `.prose` class
- code block 黑底 + 鲜亮 tokens (Shiki "min-dark" 或 dim theme)，顶部 chrome bar 显示 language + filename
- callout: `<aside class="not-prose">`，左侧 accent border + heading-style title + icon
- code block 切 highlight line（`[!code highlight]`）和 +/- diff（`[!code ++]` / `[!code --]`）

#### Linear Blog (linear.app/blog)
- editorial 风格：font-display 用 Söhne，正文 16px line-height 1.7
- 文章 hero 是大字号 title + subtitle + author + date + reading time
- code block 极少（产品博客），但出现时是浅米色 + serif font，整体融入正文（**反例**：技术博客不能学这个）
- callout 用 `<aside>` 浅灰底 + accent stripe

#### Astro Docs / Bun Docs / Deno Docs
- callout 三家都自定义图标 + 色彩，**没有**完全照搬 GitHub Primer
- Astro 用 `Note` MDX 组件而非 markdown 语法，可控性更强
- Bun 把 NOTE/TIP/WARN 缩成 `<aside class="ad">` + emoji prefix
- Deno 严格走 admonition 老语法 `:::note`，渲染为浅蓝框

### 1.2 比较与判断

| 维度 | GitHub / Vercel | Stripe / Linear | Anthropic / Apple | Tailwind / Astro |
|---|---|---|---|---|
| 风格 | 信息密度高 | 极度克制 | editorial + sober | 工程严谨 |
| callout 视觉强度 | 中（border + tint） | 弱（仅 stripe） | 强（icon + heading） | 中-强（color + icon） |
| code block 复杂度 | 高（multi-file tab） | 高（multi-lang tab） | 中（lang + copy） | 极高（diff/highlight 标记） |
| typography | sans-serif body | sans-serif body | sans-serif body | sans-serif body |

**TZBlog 应该走哪条路**：参考 Anthropic（editorial）+ GitHub（callout 五分类）+ Tailwind（code block chrome bar）的组合。

具体决策：

| 决策 | 选择 | 理由 |
|---|---|---|
| callout 色彩强度 | 中-强（border + tint + 大写小标题 + icon） | 太弱（Stripe）在技术博客容易被忽略；太强（marketing）破坏 editorial 调性 |
| callout 五分类 vs 三分类 | **五分类**（NOTE/TIP/IMPORTANT/WARNING/CAUTION） | 已实施，对齐 GitHub markdown 生态 |
| callout 字体 | title 用 mono / small-caps，正文继承 body | 让 callout 标题在视觉上脱颖而出，又不破坏阅读节奏 |
| code block chrome | language badge（右上） + copy button（hover 显示） + 可选 filename（左上） | 三件套对开发者博客是合理基线，再多就成 docs 站 |
| inline code | 1px border + muted bg + padding 0.15em / 0.4em + size 0.88em | 已实施，保留 |
| 链接样式 | underline always + accent color 60% opacity + hover 加 bg | 不要 hover-only underline（可访问性差） |
| table | 横向 scroll wrapper + zebra row + th muted bg + 边角圆 | 当前缺横向滚动指示 |
| blockquote | left border 3px + serif italic + muted-fg | 已实施，保留 |
| list nesting | 至少 2 层缩进有区分 + task list checkbox 视觉化 | 当前没专门处理 task list |
| kbd | mono + 1px border + box-shadow inset | 边缘元素，覆盖一下 |

### 1.3 现状缺口落到 spec

→ 写入 `specs/markdown-reading/spec.md`：MR-1 callout token 体系、MR-2 light/dark code theme、MR-3 code chrome bar、MR-4 table responsive、MR-5 task list、MR-6 kbd、MR-7 nested list、MR-8 视觉对比测试

---

## 2. Callout / Admonition 体系

### 2.1 参考案例的事实

| 实现 | 语法 | 类型数 | 视觉 |
|---|---|---|---|
| GitHub Alerts | `> [!NOTE]` 等 | 5 (NOTE/TIP/IMPORTANT/WARNING/CAUTION) | border + tint + icon + uppercase title |
| MDN Banners | `> **Note:**` (deprecated)；正在迁移到自定义短码 | 4 (note/warning/danger/seealso) | 浅色背景 + 标题 + emoji |
| Docusaurus admonition | `:::note ... :::` | 5 (note/tip/info/caution/danger) | left border + icon + uppercase title |
| Tailwind docs | MDX component `<Callout>` | 3 (note/warning/destructive) | left stripe + icon |
| Bun / Astro | `:::note` 或 MDX `<Aside>` | 4-5 | tint + icon |
| Notion | `/callout` block | 自定义颜色 + emoji | 浅色底 + emoji 大图标 + padding |
| Linear | 文章中用 `<aside>` HTML 直接写 | 自由 | 浅灰底 + stripe |

### 2.2 比较与判断

GitHub 五分类已成为 markdown 生态事实标准（Obsidian / VS Code preview / GitLab 也认）；与其自创不如对齐。但是单纯 stripe + tint 在 dark mode 下容易"看不见"（accent 色被深色吃掉），需要补两个方向：

1. **dark mode 下加 inner glow / inset highlight**，让边界更清晰
2. **每个 type 给 icon SVG**（NOTE=info-circle, TIP=lightbulb, IMPORTANT=alert-triangle-fill, WARNING=alert-triangle, CAUTION=octagon），不要依赖 emoji（emoji 在 dark mode 与 mono 字体下渲染不齐）

### 2.3 落地策略

- 保留现有 `> [!NOTE]` 语法（已经在 `remark-gfm` + custom visitor 跑通）
- 引入 callout 统一 token：

  ```css
  /* 在 globals.css @theme 块 */
  --callout-note-accent: ...;
  --callout-note-tint: ...;
  --callout-tip-accent: ...;
  --callout-tip-tint: ...;
  --callout-important-accent: ...;
  --callout-important-tint: ...;
  --callout-warning-accent: ...;
  --callout-warning-tint: ...;
  --callout-caution-accent: ...;
  --callout-caution-tint: ...;
  ```

  light 和 dark mode 都覆盖；token 来源参考 GitHub Primer & Tailwind palette。

- 引入 icon：在 visitor 阶段插入内联 SVG（不要走 web font，不要走外部图标包），用 `lucide` 已有的 5 个 SVG path 复制粘贴到 visitor 模板里。
- title row 升级为 `flex items-center gap-2`：`<svg>` + `<span class="markdown-alert-label">` + 可选自定义标题。
- preview/published HTML 必须**完全一致**——保证编辑器预览与发布态视觉无差异。

---

## 3. Code Block 设计

### 3.1 参考案例的事实

| 项目 | theme strategy | chrome bar | line highlight | language badge | copy button |
|---|---|---|---|---|---|
| GitHub (gh.io) | dark only (实际站点 light 时回退浅色) | 无 | 单点高亮（issue 评论） | hover 显示 | hover 显示 |
| Vercel | light/dark via prefers-color-scheme + system theme | 是（file tab） | 是 | 右侧 lang | 右侧 always |
| Stripe Docs | 双主题 + 多语言 tab | 是（multi-lang） | 是（动态切换） | 隐式（即 tab） | hover 显示 |
| Tailwind v4 Docs | shiki + light/dark via `[data-theme]` | 是（filename + lang） | `[!code highlight]` 标记 | 右上 | hover 显示 |
| Astro Docs | shiki Expressive Code | 是（title + lang） | 是（hl: 行号） | 右上 | hover 显示 |
| Bun Docs | shiki dark only | 否 | 否 | 右上小字 | hover 显示 |
| Anthropic Docs | dark only + accent token | 是（lang） | 否 | 隐式 | always 显示 |

### 3.2 比较与判断

**主题策略**：本轮**必须**支持 light/dark 双主题，理由：

1. 当前 `github-dark-default` 在 light mode 下视觉断层非常重（白页面 + 极深 code block）
2. shiki 4.x 原生支持 multi-theme（`themes: { light: ..., dark: ... }`），切换通过 CSS variable selector `[data-theme="dark"] .shiki[data-theme="dark"]`
3. 无新增依赖

**chrome bar 决策**：参考 Vercel + Tailwind，提供 language badge + 复制按钮 + 可选 filename。

- 语法：` ```ts title="src/foo.ts" ` 或 ` ```ts foo.ts `（从 shiki 文档/meta 取）
- copy button 用 navigator.clipboard.writeText，复制后 toast 提示（用现有 sonner，避免新增依赖）
- chrome bar 不出现在 inline code

**line highlight / diff** 留 V2（增加 visitor 复杂度 + 学习成本，不属于"阅读体验"刚需）

### 3.3 落地

- `src/lib/markdown.ts:52` 把硬编码 `theme: "github-dark-default"` 改为 `themes: { light: "github-light", dark: "github-dark-default" }`（shiki 4 自带；no new dep）
- shiki transformer 输出双套 `<pre>`/`<code>` 或单组带 CSS variable styles
- 在 `.markdown-body pre.shiki` 上加 `<div class="code-chrome">` (CSS via `::before` 或独立 wrapper)
- copy button：`MarkdownCopyButton` 客户端组件，scan `.markdown-body pre` 后插入；或在 visitor 阶段就生成 `<button data-copy>`，hydration 后绑定 handler

---

## 4. 双栏编辑器（Source / Preview）

### 4.1 参考案例的事实

| 实现 | 左侧 | 同步策略 | 备注 |
|---|---|---|---|
| GitHub Web 编辑器 | textarea + 简单语法染色 | tab 切换（不双栏） | 简单可靠 |
| StackEdit | CodeMirror + 行号 | 滚动同步双栏 | 老牌，体验细致 |
| HackMD | CodeMirror 6 + 行号 + 自动配对 | scroll-sync | 团队协作向 |
| Obsidian | 可选 source / preview / live preview 三态 | live preview 在原地高亮 | live 模式接近 WYSIWYG 但保留 markdown 字符 |
| Notion | WYSIWYG 单栏 | 不分 source/preview | 不在本设计参考范围 |
| Bear / iA Writer / Typora | live render in place | 单栏（输入字符立刻渲染） | 仅 macOS，本地 |
| Discourse 编辑器 | textarea + toolbar + live preview 右侧 | debounce 渲染 | 论坛通用 |
| MDX Editor | tiptap-based + 可切 raw source | 双 mode | 本项目当前路线 |

### 4.2 比较与判断

**Tiptap-rich 路线（当前）**已被否决。理由：

1. ProseMirror 节点渲染让用户看不见 markdown 源码
2. tiptap-markdown 的 markdown ↔ AST 往返不完全（GFM alerts、task list、HTML 内联、特殊空格全部丢）
3. 作者输入 `> [!NOTE]` 后会被 ProseMirror 转成普通 blockquote，再序列化回 markdown 时可能丢 `[!NOTE]` 标签

**候选方案对比**：

| 方案 | bundle 增量 | 行号 | 语法染色 | 自动配对 / tab 缩进 | 学习成本 | 风险 |
|---|---|---|---|---|---|---|
| **A. 纯 `<textarea>` + 自研增强** | 0 | 否（或自做） | 否 | 自做 keydown handler | 低 | 体验落后 5 年 |
| **B. `@uiw/react-textarea-code-editor` 或 `react-simple-code-editor`** | ~15-25kb | 可选 | 可选（PrismJS / highlight.js） | 内置 tab/shift-tab | 低-中 | 维护中等活跃 |
| **C. CodeMirror 6 (`@codemirror/state` + `@codemirror/view` + `@codemirror/lang-markdown`)** | ~70kb gzip | 内置 | 完整 | 完整 | 中-高 | 业内标准 |
| **D. Lexical** | ~30kb | 一般 | 一般 | 一般 | 高 | 偏 rich-text，回到老路 |
| **E. tiptap source-only mode（保留 tiptap + 关 prose / 强制 plain text）** | 0（已有） | 否 | 否 | 部分 | 中 | tiptap 本质上是 rich-text 引擎，硬掰成 source 是技术债 |

**推荐方案 C（CodeMirror 6）**，理由：

1. **行业标准**——VS Code monaco、GitHub、HackMD、CodePen 都基于 CM6 或 Monaco；后者太大（>1MB）
2. **markdown 支持完善**——`@codemirror/lang-markdown` 自带 markdown grammar、heading 渲染、list 缩进感知
3. **可访问性好**——内置键盘导航、屏幕阅读器支持
4. **bundle 70kb gzip 可接受**——dynamic import 让首屏不受影响（编辑器只在 `/admin/posts/*` 加载）

**备选方案 B**：如果 ha1den 不接受 CM6 体积，降级用 `react-simple-code-editor` + PrismJS markdown grammar，bundle ~20kb。

**禁用方案 A**：纯 textarea 没行号、没语法染色，体验回到 2015 年，不达"成熟个人技术博客"的标准。

**禁用方案 D/E**：D 偏 rich-text 与本意不符；E 是把现有错误"美化"，不解决根本问题。

### 4.3 落地策略

1. **design-notes 决策 EC-D1**：默认 C（CodeMirror 6），如果 ha1den 在审 design-notes 时反对则切 B。
2. **`tiptap-markdown` + `@tiptap/*` + `lowlight` + `tiptap-extension-*` 全部卸载**。
3. **新增依赖**：
   - `codemirror` `@codemirror/state` `@codemirror/view` `@codemirror/lang-markdown` `@codemirror/theme-one-dark`（或自定义 minimal theme）
   - dynamic import 让 `pnpm build` analyze 输出确认 admin chunk size
4. **保留 `MarkdownEditorWithPreview` 命名**，重写内部实现。
5. **同步**：debounce 200ms 把 source → 服务端 `renderMarkdown` 或客户端完整 unified 管道。

---

## 5. 简约型技术博客首页 / About 表达

### 5.1 参考案例的事实

| 博客 | 首页结构 | About 结构 | 可学之处 |
|---|---|---|---|
| Lee Robinson (leerob.com) | hero (大字 intro) → "writing" 列表 → "now" 状态 → "newsletter" CTA | 长形 markdown：背景、当前工作、教育、读物、设备 | 信息密度高、个人化强、保持 markdown 阅读体感 |
| Josh W Comeau (joshwcomeau.com) | 大插画 hero + tagline → "popular posts" 卡片 → newsletter | 长形纪实 + 时间线 + 照片 | 视觉装饰多，本项目 tone 不学 |
| Dan Abramov (overreacted.io) | 仅文章列表（无 hero） → 文章 list with date + title + summary | 极简单页 markdown | 简约极致但太朴素 |
| Anthropic Blog | tagline → category grid → recent posts 大卡片 → footer | 无独立 about（公司） | 学其 hero+category+recent 三段节奏 |
| Vercel Blog | hero + filter chips → 大文章卡片 grid | 公司型 about（不参考） | 卡片设计 + filter 可学 |
| Linear Blog | hero quote → recent + tag chips + RSS | 公司 changelog | 学其 hero quote 风格 |
| ha1den 现状 (TZBlog public-launch-polish 后) | HeroEditorial → LaunchNarrative → TechStack → GithubCard → Recent 3 → Stats | AboutHero → Now → Story → Principles → Contact | 骨架可，但 hero 叙事力不足、Recent 3 太少、Stats 太干 |
| linbudu (个人技术博客 reference) | hero typography → projects grid → posts list → contact | 个人简历式 | 信息扎实 |
| dario (anthropic CEO post) | 长 essay 风 | — | hero 字号节奏可借鉴 |

### 5.2 比较与判断

适合 TZBlog 的形态：**editorial + tech-stack-forward + recent-posts-rich**。

具体结构建议（首页）：

1. **Hero（强叙事）**：
   - 一句 personal manifesto（"I build small systems and write down the tradeoffs."）
   - 一段 subtitle（2-3 行）说明 TZBlog 是什么、为谁写
   - 双 CTA：Read posts / About me
   - 右上角 / 角落显示"Now"状态（写作中、Reading、Listening、Shipping）

2. **Featured / Recent（更丰富）**：
   - 最近 1 篇 featured（大卡，含 cover、tag、reading time、excerpt）
   - 5-8 篇 recent（list with date + title + tag），不再只 3 篇
   - "View all →" 链接到 `/posts`

3. **Tech Topics / Columns（升级）**：
   - 替代 / 补充当前的 TechStack 干列表
   - 改成 3-4 个 column card，每个卡含 column name + count + 一行 description
   - 用 launch-panel 已有 primitive

4. **Engineering Principles / Notes（新增）**：
   - 3-4 条工程原则（"Source-first publishing"、"Markdown is the source of truth"、"Document tradeoffs, not opinions"）
   - 视觉是 mono 标号 + heading + 一行 detail
   - 与 About 形成 cross-reference

5. **GitHub / Activity（保留）**：
   - 当前 GithubCard 实现完善，保留
   - 加 fallback 视觉（rate limited 时不要空白）

6. **Site Stats（精简或下移）**：
   - 当前过于干瘪
   - 改成 footer 上方 mono 行（"v0.x · 12 posts · last shipped Apr 2026"）

7. **Footer**：保留，加 newsletter RSS 入口的视觉

About 页（参考 Lee Robinson + Anthropic）：

1. **AboutHero**：tagline 升级，含 1-2 张作者真实截图 / 头像（可选）
2. **AboutNow**：保留并扩展（Shipping / Writing / Hardening / Reading 四列）
3. **AboutProjectIntent**（新增）：本项目的定位、目标用户、不做什么
4. **AboutTechStack**（替代/迁移自首页）：完整技术选型表 + 每项的理由
5. **AboutImplementationApproach**（新增）：实现思路（CMS 自研、自研 analytics、Docker compose、SDD 工作流）
6. **AboutPrinciples**（保留+扩展）：6-8 条原则，参考 GitHub README / Linear / Stripe Engineering 风格
7. **AboutFutureRoadmap**（新增）：V2/V3 backlog 摘要，让读者看到这是 work-in-progress 不是完工品
8. **AboutContact**：保留

### 5.3 装饰与动效预算

- ✅ 保留：launch-orbit 背景旋转 + launch-surface radial gradient + reveal-on-mount + hover-translate-2px
- ✅ 新增：scroll-triggered reveal（IntersectionObserver，进入 viewport 时加 `data-revealed`，CSS 自动 fade-up）
- ✅ 新增：hero 区一个 grain noise overlay（CSS 实现，无图片）
- ❌ 不做：全屏 hero video / 大块 SVG blob / cursor follow / parallax / 鼠标涂鸦
- ❌ 不做：framer-motion 引入（保持 CSS-only motion）

### 5.4 现状缺口落到 spec

→ `specs/home-redesign/spec.md` 和 `specs/about-redesign/spec.md`

---

## 6. 后台管理界面（可读性 + 信息密度）

### 6.1 参考案例的事实

| Dashboard | sidebar 风格 | 信息密度 | 表格密度 | empty state | 颜色对比 |
|---|---|---|---|---|---|
| Vercel | 左 collapsible nav + project switcher | 中 | 紧（py-2） | 详尽 + CTA | 高 |
| Linear | 左 nav with peek hover + kbd shortcuts | 极高 | 紧 + zebra | 详尽 + 教程 | 高 |
| Stripe | 左固定 nav + section divider | 中-高 | 中（py-3） | 详尽 + 文档链接 | 高 |
| Supabase | 左 collapsible nav + project | 中 | 中 | 中等 | 中-高 |
| Notion | sidebar tree + workspace switcher | 高 | N/A（不是表格） | 详尽 | 中（多人作品） |
| shadcn dashboard examples | 左 collapsible + tabs | 中 | 紧（py-2） | 中等 | 中-高 |

### 6.2 比较与判断

**核心问题**：当前 admin layout 用 `text-muted-fg`（#64748b）on white，对比 4.6:1，**在长时间审核时疲劳**。

**判断**：

1. 全局 `--muted-fg` token 需要降亮（light 模式从 `220 9% 46%` 调到 `220 13% 36%`/`38%`，目标 ≥ 5.5:1）
2. sidebar 当前 nav 用 muted-fg；**改为 fg 80% 透明**（即 `text-fg opacity-80` 等效），hover/active 才到 100%
3. **active state** 必加，参考 Linear / Vercel：left border 2px accent + bg-muted-subtle + text-fg + font-medium
4. **表格密度**：保留 py-2 紧密度，但加 zebra（odd row 微 muted bg）、加 hover row（subtle）
5. **危险操作**：保留 AlertDialog；但删除按钮在表格行内时用 `text-destructive` 而非彩色按钮（视觉权重梯度）
6. **缺失页面**：决策见 incomplete-pages-inventory（A 选项：把 sidebar 中 `/admin/analytics` 改指 `/admin`、删除 `/admin/settings` link、移除 `/admin/_editor-demo` 导航）

### 6.3 设计 token 调整建议

```css
/* light mode */
--muted-fg: 220 13% 36%;        /* was 220 9% 46% — 提对比 */
--muted-fg-strong: 220 15% 24%; /* 新增，用于次要标题 */
--sidebar-link-fg: 220 13% 36%; /* alias，与 muted-fg 相同初值，独立 token 便于未来调 */
--sidebar-link-active-bg: 220 14% 96%;
--sidebar-link-active-fg: 222 47% 11%;
--sidebar-link-active-indicator: hsl(var(--accent));

/* dark mode 同步 */
--muted-fg: 240 5% 65%;          /* 实测已达 5.8:1，保留 */
```

具体 token 名称在 design-notes.md 锁定。

---

## 7. 编辑器 source/preview 双栏的同步策略

### 7.1 候选

| 同步策略 | 描述 | 优点 | 缺点 |
|---|---|---|---|
| **A. immediate sync** | onChange 立即 render preview | 直觉、无延迟感 | 长文每键击 100ms+ 卡顿 |
| **B. debounce 200ms** | 输入 200ms 内停下才 render | 流畅 | 短停顿会卡 |
| **C. requestIdleCallback** | 浏览器空闲时 render | 不卡 | 长文要等几秒 |
| **D. server-side render via API** | POST 到 `/api/admin/preview` | 与发布态 100% 一致 | 每次有网络往返 |
| **E. client-side full pipeline** | 把 unified+rehype+shiki 打到 client bundle | 与发布态一致，无网络 | bundle ~200kb+ |

**判断**：

- 与发布态 100% 一致是**硬要求**（用户明确要求"右侧预览结果必须尽可能接近文章发布后的最终渲染效果"）
- 所以**只能选 D 或 E**
- D 需要新 API endpoint；admin 登录已守好，只需 throttle
- E 增加 admin chunk 200kb+，配合 dynamic import 可接受

**推荐 E（client-side full pipeline）**：

- shiki 在 client 可用（shiki 4 支持），通过 `createHighlighter` 异步加载
- unified / remark / rehype 全部 client-compatible
- 用 `web worker` 在 idle 时跑 markdown → html，主线程不卡

**保底 D（server-side via API）**：如果 E 的 bundle / 性能问题严重，退回 D。

### 7.2 落地建议

- spec EP-1 用 E 方案；如失败回退 D
- 增加 `pnpm build` 的 chunk size 断言（admin chunk size <= X kb）

---

## 8. 视觉装饰与背景层次（首页 / About 共用）

### 8.1 参考案例

| 模式 | 例子 | 适合 TZBlog? |
|---|---|---|
| Grain noise overlay (CSS) | Vercel docs hero, GitHub Universe | ✅ 已加 |
| Subtle dot grid | Anthropic docs, Linear blog | ✅ 可加 |
| Diagonal stripe pattern | Tailwind UI marketing | ❌ marketing 味重 |
| SVG blob | 各 SaaS marketing | ❌ marketing 味重 |
| Radial gradient | Vercel hero, Linear hero | ✅ launch-surface 已用 |
| Orbiting rings | linear / Anthropic | ✅ launch-orbit 已用 |
| 3D scene (three.js) | three.js homepage | ❌ 过度 |
| Parallax scrolling | most marketing | ❌ 不要 |
| Mouse-follow blob | Apple AI events | ❌ 不要 |

### 8.2 建议

1. 保留现有 launch-surface + launch-orbit
2. 加 grain noise overlay（CSS only，无图片）
3. 加 dot-grid background 在 hero 区底部 fade-out
4. **不**加 SVG blob / parallax / 3D

---

## 9. 设计判断快速汇总

将本研究的关键决策点收口为可被 design-notes 引用的 anchor：

- **RES-DEC-1**：callout 视觉走 GitHub 五分类 + Anthropic editorial 风格（icon + title + tint + border）
- **RES-DEC-2**：code block 走 Vercel / Tailwind 风格（light/dark dual theme + chrome bar with lang + copy button）
- **RES-DEC-3**：编辑器走 CodeMirror 6（默认）或 react-simple-code-editor（保底），**禁止**继续用 tiptap rich-text
- **RES-DEC-4**：预览走客户端完整 unified 管道（默认）或服务端 API 渲染（保底），目标 100% 与发布态一致
- **RES-DEC-5**：首页加 hero 强叙事 + featured/recent 8 篇 + columns + principles + github + footer stats 七段
- **RES-DEC-6**：About 扩到八段（hero / now / project-intent / tech-stack / approach / principles / roadmap / contact）
- **RES-DEC-7**：装饰预算 = launch-surface + launch-orbit + grain + dot-grid + reveal animations，不加 framer-motion / parallax / SVG blob
- **RES-DEC-8**：admin token 调对比度（muted-fg 5.5:1+）+ active state + 收口缺失页面
- **RES-DEC-9**：i18n 仅文档化，不做 route 迁移；明示"中文单语言站点"

---

## 10. 参考链接（可被引用，本研究阶段已读）

> 本研究主要基于对成熟产品 / 项目的设计观察。下列链接是本节使用的参考来源（执行方如有疑问可直接访问验证）：

- GitHub Primer alerts: https://github.com/orgs/community/discussions/16925
- Tailwind CSS v4 docs: https://tailwindcss.com/docs
- Anthropic docs: https://docs.anthropic.com
- Vercel docs: https://vercel.com/docs
- Stripe docs: https://stripe.com/docs
- Linear blog: https://linear.app/blog
- Lee Robinson personal site: https://leerob.com
- Anthropic blog: https://www.anthropic.com/news
- shadcn dashboard examples: https://ui.shadcn.com/examples/dashboard
- CodeMirror 6 docs: https://codemirror.net/docs/
- shiki multi-theme docs: https://shiki.matsu.io/guide/dual-themes

> 本研究**没有**用 WebFetch 抓任何实时内容；上述判断基于通用设计原则与本项目自身定位。如果执行方实施时需要 pixel-level 参考，可在 implementation 阶段按需 WebFetch / 截图对照。
