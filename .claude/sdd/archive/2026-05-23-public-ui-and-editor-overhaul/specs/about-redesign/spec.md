# Spec — about-redesign

> Capability：About 页 `/about` 系统性重做。
> 范围：8 段信息架构、内容来源、可信物料、与首页共用 primitive。
> 上游：`design-notes.md §7`、`design-research.md §5`、`i18n-current-state.md §15`。
> 不动：`/about` 路由本身、`generateMetadata` 签名。

---

## A-1 八段信息架构

### A-1.1 DOM 顺序

**GIVEN** 当前 5 段（AboutHero / AboutNow / AboutStory / AboutPrinciples / AboutContact）
**WHEN** 实施后
**THEN** DOM 顺序变为：
1. `<AboutHero>`
2. `<AboutNow>`
3. `<AboutProjectIntent>`（新增）
4. `<AboutTechStack>`（新增，迁移自首页 / 与首页 TechStack 互补）
5. `<AboutImplementationApproach>`（新增）
6. `<AboutPrinciples>`（保留 + 扩展）
7. `<AboutFutureRoadmap>`（新增）
8. `<AboutContact>`

用 `compareDocumentPosition` 测试断言。

### A-1.2 旧组件保留 + 扩展

**GIVEN** `AboutHero` / `AboutNow` / `AboutPrinciples` / `AboutContact` 已存在
**WHEN** 实施
**THEN** 保留组件文件路径与命名；内容扩充；不引入 `AboutStory` 的等价物（合并到 AboutProjectIntent + AboutImplementationApproach）。

---

## A-2 AboutHero

### A-2.1 内容升级

**GIVEN** 当前 AboutHero 是 1 句话 + 1 段 lead
**WHEN** 实施
**THEN** 升级为：
- eyebrow mono 标签（"ABOUT · ha1den"）
- h1 title（personal manifesto，与首页 hero 同主题但更"我"为中心；如 "I build small systems and write down the tradeoffs."）
- font-serif lede（2-3 行，说明背景）
- "Now" 状态行（与首页 hero 一致；可复用同一 source-of-truth helper）

### A-2.2 视觉

**GIVEN** AboutHero 渲染
**WHEN** 浏览器 view
**THEN** 与首页 HomeHero 视觉系统**一致但不完全相同**——同样的 launch-surface + dot-grid + reveal 入场，但视觉强度 70% 让读者明白这是次级页面。

---

## A-3 AboutNow（扩展）

### A-3.1 4 列状态

**GIVEN** 当前 `AboutNow.tsx` 是 3 列（Shipping / Writing / Hardening）
**WHEN** 实施
**THEN** 扩展为 4 列：Shipping / Writing / Reading / Hardening；每列 mono label + h3 + 1-2 行具体内容（"TZBlog from scratch with Next.js 16 · target VPS launch June 2026" / "essays on type-driven design, Markdown-as-source" / "Designing Data-Intensive Apps · TLA+ Specifications" / "Postgres pg_dump pipeline + Caddy auto-renew"）。

### A-3.2 内容来源

**GIVEN** AboutNow 内容
**WHEN** 实施
**THEN** 内容从 `src/lib/content/about.ts` 取（已存在），不允许在组件内 hardcode；about.ts 数据结构如需扩 reading column 则同步更新。

---

## A-4 AboutProjectIntent（新增）

### A-4.1 三段结构

**GIVEN** AboutProjectIntent 新组件
**WHEN** 渲染
**THEN** 包含：
- "Why this exists" 一段散文：为什么不用 Substack / Ghost / Notion 之类 SaaS
- "Who it's for" 一段：读者画像（"engineers thinking about ownership, tradeoffs, and tools"）
- "What it isn't" 一段：明确"不做营销 / 不做 SEO 套娃 / 不做付费墙"

每段 max-w-[65ch] font-serif；段落之间 `var(--space-stack)`。

### A-4.2 真实事实

**GIVEN** 内容
**WHEN** 撰写
**THEN** 必须含至少 3 个具体事实（如"自研 CMS 用了 8 天" / "完全运行在 Hetzner CX22 4GB VPS" / "源码 OSS license 见 LICENSE 文件"）；不允许全是形容词。

---

## A-5 AboutTechStack（新增）

### A-5.1 与首页 TechStack 关系

**GIVEN** 首页 `TechStack` 是 5 列名字 + hover 简短说明
**WHEN** 实施 AboutTechStack
**THEN** AboutTechStack 是**完整版**——每个技术列举 + 每项一段 1-2 行的"为什么选 / 为什么不选其他"理由；按 5 个分类组织（与首页一致）；视觉是 dl grid `sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]`（与 AboutNow 一致 dl pattern）。

### A-5.2 id="tech-stack"

**GIVEN** 首页 TechStack 链接 `<Link href="/about#tech-stack">`（spec H-6.3）
**WHEN** AboutTechStack 渲染
**THEN** section root 有 `id="tech-stack"`；浏览器 hash 跳转可达；smooth scroll OK。

### A-5.3 内容来源

**GIVEN** 技术列表
**WHEN** 实施
**THEN** 数据存在 `src/lib/content/tech-stack.ts`（新建）：`{ category, items: [{ name, version?, rationale }] }`；同源数据被首页 TechStack 和 AboutTechStack 共用。

---

## A-6 AboutImplementationApproach（新增）

### A-6.1 四项工程方法论

**GIVEN** AboutImplementationApproach
**WHEN** 渲染
**THEN** 介绍本项目使用的工程方法论：
- "SDD + TDD micro-cycles" — link to memory-bank/systemPatterns 摘要
- "Self-hosted CMS over CMS-as-a-service" — 列举自研 vs 三方 trade-off
- "Markdown is the source of truth" — 链接到 `editor-source-contract` 决策
- "Document tradeoffs in memory-bank" — 解释项目内 memory-bank 体系

每项 mono 编号 + h3 + 一段散文 + 可选代码片段（如 SDD 微循环 commit 示例）。

### A-6.2 代码片段视觉

**GIVEN** 段落中含代码片段（如 commit message 示例）
**WHEN** 渲染
**THEN** 用 `<pre class="shiki">` 或类似 code-block primitive 渲染；与详情页 markdown code block 视觉一致（同主题、同 chrome 风格简化版）。

---

## A-7 AboutPrinciples（保留 + 扩展）

### A-7.1 6-8 条原则

**GIVEN** 当前 AboutPrinciples 是 3 条卡片（Source-first / Operational ownership / Written tradeoffs）
**WHEN** 实施
**THEN** 扩展到 6-8 条；每条 mono 编号 + h3 + 1-2 行散文 detail；grid `sm:grid-cols-2 lg:grid-cols-3` 排布；用 `launch-panel` primitive。

### A-7.2 与首页 HomePrinciples 互不重叠（spec H-5.2）

**GIVEN** 首页 4 条原则
**WHEN** About 8 条原则
**THEN** 8 条中包含首页那 4 条但展开更详尽；额外 4 条是 about 独有；测试断言两边不 100% 重叠（已在 H-5.2 描述）。

---

## A-8 AboutFutureRoadmap（新增）

### A-8.1 V2 / V3 摘要

**GIVEN** memory-bank/progress.md 有 V2 / V3 backlog
**WHEN** AboutFutureRoadmap 渲染
**THEN** 显示三列（或 timeline）：
- **当前**（MVP）：核心功能列表 link 到 progress.md
- **V2**：主题 GUI / 详细 analytics / 编辑器增强 / 邮件通知
- **V3**：多语言 i18n（明示中文单语言现状，与 i18n-current-state §15 一致）

每项一行 mono + label + brief description；link 到详细 SDD（如有归档）。

### A-8.2 i18n 显式声明

**GIVEN** ha1den 任务清单要求"明示中文单语言"
**WHEN** AboutFutureRoadmap 渲染
**THEN** 含一段明确文字（按 i18n-current-state §15 给出的模板或等效文字）："TZBlog 目前是一个中文单语言（zh-CN）个人技术博客。数据模型预留了多语言能力，但当前 UI、SEO、RSS、sitemap、后台编辑均未启用多语言路径。"

---

## A-9 AboutContact 保留

### A-9.1 内容微调

**GIVEN** 当前 AboutContact 是邮件 + 3 个社交链接
**WHEN** 实施
**THEN** 保留；视觉容器升级到与其它 section 一致（无单独装饰）；社交链接 hover 用 accent 色高亮。

---

## A-10 视觉系统一致性

### A-10.1 复用 launch-panel / launch-surface

**GIVEN** AboutPrinciples / AboutProjectIntent / AboutFutureRoadmap 等卡片型 section
**WHEN** 实施
**THEN** 复用 `launch-panel` / `launch-surface` primitive（与首页 HomePrinciples / HomeColumns 一致）；不允许引入新 panel 样式。

### A-10.2 字号 / 间距与首页一致

**GIVEN** About 每个 h2 / h3 / lede
**WHEN** CSS 渲染
**THEN** 与首页对应级别字号一致（都从 `var(--text-h2)` / `var(--text-h3)` / `var(--text-lead)` 取）；段落间距 `var(--space-stack)` / `var(--space-stack-lg)`。

### A-10.3 dark mode 验证

**GIVEN** dark mode
**WHEN** About 全页浏览
**THEN** 所有段落 / 卡片 / 链接颜色都达 WCAG AA；测试断言关键 selector 在 dark class 下的 token 取值。

---

## A-11 内容数据 source-of-truth

### A-11.1 集中在 about.ts / tech-stack.ts

**GIVEN** About 内容
**WHEN** 实施
**THEN** 所有可枚举内容（principles 列表、tech-stack 列表、now 状态、roadmap 列表）存在 `src/lib/content/about.ts`（已存在）和 `src/lib/content/tech-stack.ts`（新建）；组件本身不允许 hardcode 列表。

### A-11.2 类型安全

**GIVEN** content 文件
**WHEN** export
**THEN** export 含 TypeScript interface（如 `Principle`, `TechItem`, `RoadmapItem`），所有组件按 interface 消费。

---

## A-12 测试覆盖

### A-12.1 page.test.tsx 改造

**GIVEN** 当前 `src/app/(site)/about/page.test.tsx` 是 88 行 / 5 specs
**WHEN** 实施
**THEN** 测试更新为 8 段 DOM 顺序；新增 spec：AboutProjectIntent rendering / AboutTechStack hash anchor / AboutFutureRoadmap i18n 声明文本断言 / AboutPrinciples ≥6 条。

### A-12.2 子组件单测

**GIVEN** 各 about/* 组件
**WHEN** 实施
**THEN** 每个新组件 ≥ 2 spec；如 `AboutProjectIntent.test.tsx` 测三段标题存在 + 每段含 ≥1 specific fact。

### A-12.3 i18n 文案断言

**GIVEN** AboutFutureRoadmap 含 i18n 声明
**WHEN** 测试
**THEN** 断言文本含关键字 "中文单语言"、"数据模型预留"、"V3"。
