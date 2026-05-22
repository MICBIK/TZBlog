# Design System — Editorial / 杂志风

> ha1den 已锁定 Editorial 方向。本文档定义所有视觉任务（hero-editorial / tech-stack-section / github-data-card / about-page）共享的设计基线。
>
> **执行优先级**：1.1 hero-editorial 在实现阶段建立 `src/app/globals.css` 的 `@theme` 块；后续 1.2 / 1.3 / 2.1 引用同一组 CSS 变量，禁止再造新 token。

> ⚠️ **重要**：`globals.css` 实际路径是 `src/app/globals.css`（不是 `src/styles/globals.css`）。现有 `--font-sans` 已经 chain 了 `--font-geist-sans` + CJK fallback；Editorial 接入时新增 `--font-serif` 不要冲突。

## 视觉精神

Editorial / 杂志风：把博客当一本杂志来排。重视：

- **typography 主导**：serif 标题 + sans 正文的明显区分；显著的尺寸对比
- **慷慨留白**：节段间 5-10vw 间距，正文 max-width ≈ 75ch
- **微妙细节**：hairline label（小字 uppercase tracking）/ 元数据（dateline / byline）/ rule lines
- **单一强调色克制**：每屏只用 accent 一次（CTA / link / 数字高亮）
- **结构破缺**：hero 可以打破 12-col 对称（如 7+5 / 8+offset）；不要 centered hero + gradient blob

## Typography

### Type pair（待 hero-editorial 选定后所有任务对齐）

- **标题**：serif（推荐候选 `Source Serif 4` / `Newsreader` / `Crimson Pro`，自托管走 `next/font/google`）
- **正文**：sans（推荐候选 `Inter` / `Geist Sans`，自托管走 `next/font/google`）
- **mono**（已存在 + 保留）：当前 codebase 用的 monospace 不需要换

> 字体选择由 hero-editorial 任务在 `design-notes.md` 决策并落地到 `src/app/layout.tsx` 的 `next/font` 配置。

### Type scale（clamp-driven）

| Token | Range | Use |
|-------|-------|-----|
| `--text-base` | `clamp(1rem, 0.92rem + 0.4vw, 1.125rem)` | body |
| `--text-lead` | `clamp(1.125rem, 1rem + 0.5vw, 1.375rem)` | intro paragraphs / lede |
| `--text-h3` | `clamp(1.5rem, 1.25rem + 0.75vw, 2rem)` | section subheads |
| `--text-h2` | `clamp(2.25rem, 1.75rem + 1.5vw, 3.5rem)` | section heads |
| `--text-h1` | `clamp(3rem, 2rem + 4vw, 6rem)` | page heads (非 hero) |
| `--text-hero` | `clamp(3.5rem, 2rem + 7vw, 9rem)` | **only** hero |
| `--text-label` | `0.75rem` (固定，配 `letter-spacing: 0.12em uppercase`) | hairline labels |

### Tracking

- 标题：`-0.02em` 到 `-0.04em`（紧凑）
- 正文：默认 `0`
- Hairline labels：`0.12em` + `uppercase`

### Line height

- 标题：`0.95` 到 `1.1`
- 正文：`1.65`（长文友好）

## Palette

**禁止引入新色值**。所有颜色经 `src/app/globals.css` 的 `@theme` 块以 CSS 变量定义。

复用现有 token（来自当前 codebase）：

- `--bg` / `--fg` / `--muted` / `--muted-fg` / `--accent` / `--border` / `--ring` / `--primary` / `--destructive`

Editorial 风的特殊用法：

- `--fg` 用作正文 / 标题主色
- `--muted` 用于 hairline label / 元数据 / rule line
- `--accent` 每屏限 1 处（hero CTA / 文章链接 / 数字高亮）

## Spacing

Editorial 风的间距倾向于"宽，且节奏感"：

| Token | Range | Use |
|-------|-------|-----|
| `--space-section` | `clamp(4rem, 3rem + 5vw, 10rem)` | 顶层 section 之间 |
| `--space-stack-lg` | `clamp(2rem, 1.5rem + 1.5vw, 3.5rem)` | hero 内部 stack |
| `--space-stack` | `clamp(1rem, 0.75rem + 1vw, 2rem)` | 常规 stack（meta + heading + body）|
| `--space-paragraph` | `clamp(0.75rem, 0.5rem + 0.5vw, 1.25rem)` | 段落之间 |

## Grid

- 基线：12-col grid，gap 由 Tailwind 默认（或 `--grid-gap: clamp(1rem, 0.5rem + 1vw, 2rem)`）
- **Hero 允许打破对称**：建议 `lg:grid-cols-[7fr_5fr]` 或 `lg:grid-cols-[8fr_4fr]`，content 偏左
- **正文 max-width**：`max-w-[75ch]`（约 600-680px），保证长文 readability
- **Sidebar / aside**：lg 断点用 `200-280px` 固定宽度

## Motion

- **初始 reveal**：`opacity: 0 → 1` + `transform: translateY(8px) → 0`，duration `600-800ms`，`ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`)
- **stagger**：子元素 60-100ms 错峰
- **禁止**：循环动画、bouncy spring、parallax（除非 ha1den 明示）
- **强制**：`@media (prefers-reduced-motion: reduce)` 完全禁用 transform/opacity，保留结构

## Editorial Signature Elements（招牌细节）

按需选用，建议每屏至少 2 个：

1. **Hairline label**（如 `ISSUE 002 · MAY 2026` / `BLOG · ESSAY`）：tiny uppercase + `--accent` 或 `--muted-fg`
2. **Rule line**（一条 1px `border-t border-border` 横线，2-4ch 宽，作为标题分隔器）
3. **Dateline / byline**：标题下/旁的小字元数据（`ha1den · 5 min read · May 2026`）
4. **Drop cap**（可选，长文首段第一字 4-line drop）
5. **Numbered marginalia**（边注式数字，hero 上方 `001` `002` 标记）
6. **Issue label**（顶部 `Issue 002 · May 2026` 类杂志期号）

## Anti-template Checklist（hero-editorial 必过）

- [ ] 不用 centered hero
- [ ] 不用 gradient blob / 模糊渐变背景
- [ ] 不用 3 个等宽 cards 排开
- [ ] 不用 generic CTA "Get Started"
- [ ] 不用单 sans-serif 字体走完全场
- [ ] 不用对称网格 + 等距 padding 走完全场
- [ ] hover/focus/active 状态全部设计过，不是 shadcn 默认
- [ ] 每屏至少 4 个 Editorial signature elements 之一

## Tailwind v4 实施提示

```css
/* src/app/globals.css — 实际路径（注意：不是 src/styles/） */
@theme {
  --font-serif: 'Source Serif 4', Georgia, 'Times New Roman', serif;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;

  --text-base: clamp(1rem, 0.92rem + 0.4vw, 1.125rem);
  --text-lead: clamp(1.125rem, 1rem + 0.5vw, 1.375rem);
  --text-h3:   clamp(1.5rem, 1.25rem + 0.75vw, 2rem);
  --text-h2:   clamp(2.25rem, 1.75rem + 1.5vw, 3.5rem);
  --text-h1:   clamp(3rem, 2rem + 4vw, 6rem);
  --text-hero: clamp(3.5rem, 2rem + 7vw, 9rem);
  --text-label: 0.75rem;

  --space-section:     clamp(4rem, 3rem + 5vw, 10rem);
  --space-stack-lg:    clamp(2rem, 1.5rem + 1.5vw, 3.5rem);
  --space-stack:       clamp(1rem, 0.75rem + 1vw, 2rem);
  --space-paragraph:   clamp(0.75rem, 0.5rem + 0.5vw, 1.25rem);

  --tracking-tight:    -0.03em;
  --tracking-label:    0.12em;

  --leading-display:   1.05;
  --leading-body:      1.65;

  --ease-out-expo:     cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast:     200ms;
  --duration-normal:   600ms;
  --duration-slow:     800ms;
}
```

Tailwind 使用：`text-[var(--text-hero)]` / `font-serif` / `leading-[var(--leading-display)]` / `tracking-[var(--tracking-tight)]` / 等。

## 组件命名

- `HeroEditorial.tsx`（不是 `Hero.tsx`，避免与未来其他 hero 风格冲突）
- `IssueLabel.tsx` / `Dateline.tsx` / `RuleLine.tsx`（如果抽象 reusable）
- Section 容器：`EditorialSection.tsx`（仅当出现 ≥3 处复用时抽，否则就地 className）

## 灵感锚点（脑内参考，不要照搬）

- Robin Sloan 的个人站
- The New Yorker 文章页
- Frank Chimero 的博客
- Stripe Press 书页
- Cabel Sasser 的写作页

## 不要做的事

- 不要为了"Editorial 感"硬塞 Lorem Ipsum 装饰性长文（保留博客真实内容）
- 不要把 Tech Stack / GitHub 卡硬改成杂志栏目（保留功能本质，只换 chrome）
- 不要在 Tailwind 里硬编码字号（必须走 `--text-*` 变量）
- 不要装新字体库（用 `next/font/google` 自托管 2 个家族足够）
