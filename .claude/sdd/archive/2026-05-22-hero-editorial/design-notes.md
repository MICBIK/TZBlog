# design-notes — hero-editorial

## ASCII mockup（lg+ 不对称网格）

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                                                                                │
│  ── 7/12 main column ────────────────────────  ── 5/12 aside ─────────────────│
│                                                                                │
│                                                001 / NOTES                     │
│                                                                                │
│                                                BLOG · ISSUE 002 · MAY 2026     │
│                                                ──                              │
│                                                                                │
│   Building things,                             ha1den · Notes from the field   │
│   one commit                                   · May 2026                      │
│   at  a  time.                                                                 │
│   (serif, --text-hero clamp 3.5→9rem)          (serif italic, --text-base)     │
│                                                                                │
│   ──   (rule line w-12)                                                        │
│                                                                                │
│   Read Blog →    About →                                                       │
│   (CTA buttons, font-sans)                                                     │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
                                  ↑                          ↑
                            grid-cols-7fr          grid-cols-5fr
                            (left main)            (right aside)
```

### Mobile (< lg)

```
┌────────────────────────────────────────────┐
│                                            │
│  001 / NOTES                               │
│                                            │
│  BLOG · ISSUE 002 · MAY 2026               │
│  ──                                        │
│                                            │
│  Building things,                          │
│  one commit                                │
│  at a time.                                │
│                                            │
│  ha1den · Notes from the field · May 2026  │
│                                            │
│  ──                                        │
│                                            │
│  Read Blog →    About →                    │
│                                            │
└────────────────────────────────────────────┘
```

## Locked content

- **hero h1 tagline**: `Building things, one commit at a time.`
  - 三行视觉断行（手动 `<br />` 或 `<span class="block">` 控制）
  - 在 mobile 可允许自动 wrap
- **hairline label**: `BLOG · ISSUE 002 · MAY 2026`
  - "ISSUE" 数字可硬编码（不动态查 commit 数量；那是 noise）
- **dateline**: `ha1den · Notes from the field · May 2026`
- **marginalia**: `001 / NOTES`
- **CTAs**: 复用现有 `<Button asChild size="lg">` 套 `<Link href="/posts">` 和 `<Link href="/about">`
  - 文本：`Read Blog →` / `About →`（加 → 后缀作为 Editorial 微细节）

## Locked decisions

| # | 决策 |
|---|------|
| R1 | Font pair: **Source Serif 4 + Inter** via next/font/google |
| R2 | Motion: **CSS-only**（@keyframes + data-reveal + animation-delay）|
| R3 | Primitive 抽取: **延后**（等其他 SDD 复用 IssueLabel/Dateline 后再抽）|
| R4 | Grid 比例: **7fr_5fr** |
| R5 | hero h1 size: `clamp(3.5rem, 2rem + 7vw, 9rem)` |
| R6 | `--font-sans` 链路: Inter → Geist → CJK fallback |
| R7 | next/font 加载: variable + display swap + latin subset |
| R8 | 暗色模式: 不写专属样式，CSS vars 自然 follow |

## 完整 @theme block（拷贝到 globals.css）

```css
@theme {
  /* Fonts */
  --font-serif:
    var(--font-source-serif), Georgia, "Times New Roman",
    "PingFang SC", "Hiragino Sans GB", "Noto Serif CJK SC", serif;

  /* Type scale (clamp-driven, fluid responsive) */
  --text-base: clamp(1rem, 0.92rem + 0.4vw, 1.125rem);
  --text-lead: clamp(1.125rem, 1rem + 0.5vw, 1.375rem);
  --text-h3:   clamp(1.5rem, 1.25rem + 0.75vw, 2rem);
  --text-h2:   clamp(2.25rem, 1.75rem + 1.5vw, 3.5rem);
  --text-h1:   clamp(3rem, 2rem + 4vw, 6rem);
  --text-hero: clamp(3.5rem, 2rem + 7vw, 9rem);
  --text-label: 0.75rem;

  /* Spacing (fluid sections) */
  --space-section:   clamp(4rem, 3rem + 5vw, 10rem);
  --space-stack-lg:  clamp(2rem, 1.5rem + 1.5vw, 3.5rem);
  --space-stack:     clamp(1rem, 0.75rem + 1vw, 2rem);
  --space-paragraph: clamp(0.75rem, 0.5rem + 0.5vw, 1.25rem);

  /* Tracking */
  --tracking-tight: -0.03em;
  --tracking-label:  0.12em;

  /* Leading */
  --leading-display: 1.05;
  --leading-body:    1.65;

  /* Motion */
  --ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast:    200ms;
  --duration-normal:  600ms;
  --duration-slow:    800ms;
}
```

## globals.css 改动（合并到现有 :root 块）

```css
:root {
  /* ... existing tokens (--bg, --fg, etc.) ... */

  /* 改 --font-sans 把 Inter 加到最前 */
  --font-sans:
    var(--font-inter), var(--font-geist-sans), ui-sans-serif, system-ui,
    -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB",
    "Source Han Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;

  /* --font-mono unchanged */
}
```

## globals.css 追加（在 :root 块之后）

```css
/* Editorial reveal animation */
@keyframes editorial-reveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

[data-reveal] {
  animation: editorial-reveal var(--duration-slow, 800ms) var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)) backwards;
  animation-delay: var(--reveal-delay, 0ms);
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

## HeroEditorial.tsx 骨架

```tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroEditorial() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="grid gap-8 lg:grid-cols-[7fr_5fr] lg:gap-12"
    >
      {/* Main column: hero h1 + CTAs */}
      <div className="space-y-8">
        <h1
          id="hero-heading"
          data-reveal
          style={{ "--reveal-delay": "0ms" } as React.CSSProperties}
          className="font-serif text-[var(--text-hero)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg"
        >
          Building things,
          <br />
          one commit
          <br />
          at a time.
        </h1>

        <div
          data-reveal
          style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
          className="h-px w-12 border-t border-border"
          aria-hidden="true"
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            asChild
            size="lg"
            data-reveal
            style={{ "--reveal-delay": "180ms" } as React.CSSProperties}
          >
            <Link href="/posts">Read Blog →</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            data-reveal
            style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
          >
            <Link href="/about">About →</Link>
          </Button>
        </div>
      </div>

      {/* Aside column: signature elements */}
      <aside className="space-y-4 lg:pt-2">
        <p
          data-reveal
          style={{ "--reveal-delay": "60ms" } as React.CSSProperties}
          className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg"
        >
          001 / NOTES
        </p>

        <p
          data-reveal
          style={{ "--reveal-delay": "100ms" } as React.CSSProperties}
          className="text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg"
        >
          BLOG · ISSUE 002 · MAY 2026
        </p>

        <div className="h-px w-8 border-t border-border" aria-hidden="true" />

        <p
          data-reveal
          style={{ "--reveal-delay": "160ms" } as React.CSSProperties}
          className="font-serif italic text-[var(--text-base)] text-muted-fg leading-[var(--leading-body)]"
        >
          ha1den · Notes from the field · May 2026
        </p>
      </aside>
    </section>
  )
}
```

## Anti-template checklist 验证

- [x] **不对称网格**（7fr_5fr，不居中）
- [x] **serif + sans 配对**（Source Serif 4 + Inter）
- [x] **Hairline label**（uppercase tracking）
- [x] **Rule line**（短 border-t）
- [x] **Dateline**（serif italic 元数据）
- [x] **Numbered marginalia**（001 / NOTES）
- [x] **真设计的 hover**（CTA 含 → 后缀；hover state from Button variant，Editorial 风）
- [x] **真颜色克制**（一屏只用 --accent 在 CTA primary button）

✅ 8/8 项满足，远超 "至少 4 项" 的 CLAUDE.md design-quality 要求

## 现有 hero 删除清单

`src/app/(site)/page.tsx` line 22-46 整段（包括 `{/* Hero */}` 注释）替换为：

```tsx
<HeroEditorial />
```

import 加：
```tsx
import { HeroEditorial } from "@/components/site/HeroEditorial"
```

`getCurrentLocale()` / `listPosts()` / `getSiteStats()` 调用保留（其他 section 仍需）。

## Playwright gap（明示文档化）

`package.json` 当前不含 Playwright，所以以下测试无法自动化：

- 字体实际渲染（Source Serif 4 真在 hero h1 上）
- 视觉回归（hero 布局 desktop / tablet / mobile）
- prefers-reduced-motion emulation 实测
- Editorial 视觉协调性（一眼"杂志感"）

**Mitigation**：
- jsdom 测试覆盖 className / data-* attribute / DOM 结构
- ha1den 在 dev server 手动 smoke（dev server 跑后看页面）
- 后续 lighthouse-prep SDD 或 P4 阶段引入 Playwright

## 暗色模式适配

不为 dark 写专属 CSS。所有用到的 token（`--bg`, `--fg`, `--muted-fg`, `--accent`, `--border`）已在 globals.css 的 dark mode 媒体查询或 class 切换下自然反转。Editorial 视觉在两个 mode 下都该 work。

如果实测发现 dark 下 hero 不够"重"（serif 字体在 dark 上对比度问题），考虑：
- dark 下用 `text-fg/95` 而非 `text-fg`（不在本 SDD 处理，记 design-notes follow-up）

## Risks 进一步说明（接续 proposal）

- **风险**：新字体加载增加 LCP。
  - **缓解**：Latin subset only；display swap；ha1den 上线后 lighthouse-prep 跑实测确认是否超标
- **风险**：admin 路径字体变化造成视觉回归。
  - **缓解**：Admin 用的 `font-sans` 在新 chain 下还是工作（Inter 优先 → Geist fallback）；字距 / x-height 微变可接受
  - **fallback**：若实测确认 admin 视觉破坏，design-notes 提供 escape：在 `(admin)/layout.tsx` 加 `className="font-[var(--font-geist-sans)]"` 硬绑 admin 用 Geist
- **风险**：Tailwind v4 @theme 块与现有 :root vars 顺序敏感。
  - **缓解**：实测过 Tailwind v4 ; @theme 在 :root 前可工作（Tailwind 提取 token 形成 utility，:root 是 cascade var）
