# Proposal — hero-editorial

> Stage: Pre-deploy P2 cleanup
> Created: 2026-05-22
> Path: `.claude/sdd/hero-editorial/`
> Tier: T1 / 1-2 days implementation
> 视觉方向：Editorial / 杂志风（ha1den 锁定）

## Why

当前 `src/app/(site)/page.tsx:22-46` 的 hero 是模板级（centered h1 + 1 副标 + 2 按钮），违反 ECC anti-template policy（CLAUDE.md design-quality 段）：

```tsx
<section className="space-y-6">
  <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
    Hi, I&apos;m HaiDen.
  </h1>
  <p className="text-lg text-muted-fg md:text-xl">
    A developer who builds things and writes about them.
  </p>
  ...
</section>
```

问题：
- 居中标题 + sans-serif 字体 + 2 button = 通用模板，缺辨识度
- 无 Editorial 元素（hairline label / rule line / dateline 等）
- 字号阶梯无张力（5xl → 7xl ≠ Editorial 戏剧感）
- 无 motion，无 reduce-motion 处理

不修这层，homepage 永远不像"ha1den's blog"，像 "Next.js starter template"。

## What

3 个 capability：

### Capability: typography-system
- 引入 `Source Serif 4`（serif 标题）+ `Inter`（sans 正文），通过 `next/font/google`，`subsets: ["latin"]`
- 在 `src/app/layout.tsx` 加 next/font 实例 + className 挂到 `<html>` 或 `<body>`
- 在 `src/app/globals.css` 添加 `@theme` 块（Tailwind v4）扩展 token：
  - `--font-serif`: 新增（指向 Source Serif 4 variable）
  - `--font-sans`: 改为 `var(--font-inter), ...` 链路（保留 CJK fallback；不破坏现有 mono）
  - `--text-base / lead / h3 / h2 / h1 / hero / label`: clamp 流体字号
  - `--space-section / stack-lg / stack / paragraph`: 流体间距
  - `--tracking-tight / label`: 字距
  - `--leading-display / body`: 行高
  - `--ease-out-expo / duration-fast / normal / slow`: motion
- 现有 `--font-geist-mono` 保留（mono 不换）
- 现有 `--font-geist-sans` 保留作 fallback 但优先级降低

### Capability: hero-component
- 新建 `src/components/site/HeroEditorial.tsx` (RSC; client only 在 motion 部分需要)
- 布局：`lg:grid-cols-[7fr_5fr]` 不对称网格（左主右辅）
- 主区：
  - hero h1 用 `--text-hero` 字号 + serif 字体 + `--tracking-tight`
  - 2 CTA（"Read Blog" / "About Me"），保留现有 hrefs
- 副区（5/12 column 在 lg+）：
  - Editorial signature elements ≥4：
    - **Hairline label** 顶端（如 `BLOG · ISSUE 002 · MAY 2026`）—— uppercase tracking-wide
    - **Dateline / byline**（如 `ha1den · Notes from the field · May 2026`）—— 小字 serif italic
    - **Rule line**（`w-12 border-t border-border`）—— 标题与正文之间
    - **Numbered marginalia**（`001 / NOTES`）—— 副区上方
- mobile：单列堆叠，副区落到主区下方

### Capability: motion-a11y
- 初始 reveal：opacity 0 → 1 + translateY(8px) → 0，duration 800ms，ease-out-expo
- CSS-only（不装 Framer Motion）
- `@media (prefers-reduced-motion: reduce)`：禁用所有 transform/opacity 动画，保留结构
- stagger：子元素 60-80ms 错峰（CSS animation-delay）

### 不在范围
- Tech Stack 区块改造（→ tech-stack-section SDD）
- GitHub 数据卡（→ github-data-card SDD）
- About 页（→ about-page SDD）
- Recent Posts / Site Stats 区块（已 ship 在 D1，本任务不动）
- Header / Footer 重做
- 暗色模式专属设计（保持现有暗色变量映射，Editorial 自然 follow）

## Decisions

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R1 | Font pair：Source Serif 4 + Inter / Newsreader + Geist Sans / Crimson Pro + IBM Plex | **Source Serif 4 + Inter** | Source Serif 4 由 Adobe 开放，有完整 variable axis；Inter 是社区事实标准；两者 Latin subset 都小（<50kb）；CJK fallback 走系统字体（无需独立加载 |
| R2 | Motion 库：Framer Motion / GSAP / CSS-only | **CSS-only** | 不增加 bundle；reveal 简单到不需要库；prefers-reduced-motion 在 CSS 媒体查询内自然处理 |
| R3 | Primitive 抽：`<IssueLabel>` / `<Dateline>` / `<RuleLine>` 分离 vs 内联 | **内联**（hero-editorial 阶段） | YAGNI；其他 SDD（tech-stack / github-card / about）尚未确定都用这些元素；等 2 处复用再抽 |
| R4 | Grid 比例：7fr_5fr / 8fr_4fr / 2fr_1fr | **7fr_5fr** | 主区够大放 hero h1，副区够小放 metadata；7:5 比 2:1 更不对称（杂志感更强）|
| R5 | Hero h1 字号上限 | `clamp(3.5rem, 2rem + 7vw, 9rem)` | 桌面顶满 9rem (144px) ≈ 杂志大标题；移动 3.5rem (56px) 不破版 |
| R6 | `--font-sans` 变量是否覆盖 | **覆盖**：从 Geist 优先改为 Inter 优先，Geist 作 fallback | Inter 与 Editorial 风更搭；保留 Geist fallback 保证现有 component 不崩 |
| R7 | next/font 加载策略 | `display: "swap"` + variable | swap 避免 FOIT；variable 走 CSS var 避免 className 污染 |
| R8 | Anti-template checklist 通过几项 | **至少 4 项**（不对称网格 / serif+sans 配对 / hairline label / 真设计的 hover） | CLAUDE.md design-quality 要求"每个 frontend surface ≥4 项 Required Qualities" |

## Capabilities 摘要

| capability | spec 文件 | spec-id 范围 |
|---|---|---|
| typography-system | `specs/typography-system/spec.md` | SPEC-HE-T-1..3 |
| hero-component | `specs/hero-component/spec.md` | SPEC-HE-H-1..6 |
| motion-a11y | `specs/motion-a11y/spec.md` | SPEC-HE-M-1..2 |

## Impact

- 修改：
  - `src/app/layout.tsx`（add next/font instances + className）
  - `src/app/globals.css`（add `@theme` block + maybe :root font-var fallback chain）
  - `src/app/(site)/page.tsx`（替换 hero section，保留其他）
- 新增：
  - `src/components/site/HeroEditorial.tsx`
  - `src/components/site/HeroEditorial.test.tsx`
- 依赖：无新装（next/font 是 Next.js 内置）

## Out of scope

- 其他视觉任务（→ 各自 SDD）
- 字体性能微调（如 subset 进一步裁剪 / preload —— 推 lighthouse-prep SDD）
- 动画细化（hover 状态等已包含；但 scroll-driven 动画 / parallax / 等推 V2）
- 暗色模式特殊处理（Editorial 应在两个 mode 下都 work，不为 dark 写额外设计）

## Workflow

1. SDD 8 件套一次性建好
2. **§A typography-system**:
   - A.1 [TEST-RED] `test(site-home): SPEC-HE-T-1..3 fonts + @theme tokens present`
   - A.1 [IMPL-GREEN] `feat(site-home): SPEC-HE-T-1..3 Editorial typography system`
3. **§B hero-component**（多 micro-cycle，每 spec 一对）
4. **§C motion-a11y**（2 micro-cycle）
5. **§D 集成**：page.tsx 接 HeroEditorial（验证不破 Recent Posts / Site Stats）
6. 跑质量门：`pnpm typecheck && pnpm lint && pnpm test && pnpm build`
7. 写 completion-report.md
8. **不**自动 finish-feature / archive

## Risks

| 风险 | 缓解 |
|------|------|
| next/font 加载新字体增加 LCP | Latin subset only，display swap；ship 后 lighthouse-prep 跑实测 |
| @theme block 与现有 :root vars 冲突 | 详 design-notes：@theme 是 Tailwind v4 token 扩展，与 :root vars 并行不冲突 |
| ColumnsTable / PostsTable 因字体 className 变化产生回归 | 不动 admin 路径；admin 路径的 className 来自 layout.tsx 但变化是 superset，向后兼容 |
| Editorial 暗色模式不优雅 | 用 CSS vars（--bg/--fg/--accent），暗色自动跟；不为 dark 写特殊样式 |
| jsdom 不 render fonts（测试看不到字体） | 测试只断言 className 含 `font-serif` 而非真实字体；视觉验证靠 dev server + 人 |
| 用户 reduce-motion 但 reveal 动画破坏布局 | reduce-motion 媒体查询同时禁用 transform 和 opacity，避免内容隐藏 |
| Hero 用 `<img>` 时 LCP / CLS | hero 无图（仅 typography）；如未来加 hero image，必须 `next/image` + explicit dimensions |
