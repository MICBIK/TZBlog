# specs/typography-system — Editorial typography 实施

> spec-id 前缀：`SPEC-HE-T`

## SPEC-HE-T-1 — next/font 加载 Source Serif 4 + Inter

```gherkin
GIVEN src/app/layout.tsx currently imports Geist_Sans and Geist_Mono from next/font/google
  AND has them mounted as className on <html> or <body>

WHEN executing this spec

THEN layout.tsx should additionally import Source_Serif_4 and Inter from next/font/google:
  ```ts
  import { Source_Serif_4 } from "next/font/google"
  import { Inter } from "next/font/google"

  const serif = Source_Serif_4({
    subsets: ["latin"],
    variable: "--font-source-serif",
    display: "swap",
  })

  const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
  })
  ```

AND the className chain on <html> (or <body>) must include:
  - serif.variable
  - inter.variable
  - existing geistSans.variable
  - existing geistMono.variable

AND existing Geist imports remain (don't break)

AND test verifies: rendered <html> contains className with substrings "font-source-serif", "font-inter" (or whatever variable names chosen)
```

## SPEC-HE-T-2 — globals.css @theme block 新增 Editorial token

```gherkin
GIVEN src/app/globals.css currently has :root { ... } CSS vars (--bg, --fg, --font-sans, etc.)

WHEN executing this spec

THEN globals.css should add a new @theme block (Tailwind v4 syntax) BEFORE :root, containing:
  - --font-serif: var(--font-source-serif), Georgia, "Times New Roman", serif;
  - --text-base, --text-lead, --text-h3, --text-h2, --text-h1, --text-hero, --text-label (clamp values per design-notes)
  - --space-section, --space-stack-lg, --space-stack, --space-paragraph (clamp values)
  - --tracking-tight (-0.03em), --tracking-label (0.12em)
  - --leading-display (1.05), --leading-body (1.65)
  - --ease-out-expo, --duration-fast/normal/slow

AND :root --font-sans should be updated:
  FROM: --font-sans: var(--font-geist-sans), ui-sans-serif, ...
  TO:   --font-sans: var(--font-inter), var(--font-geist-sans), ui-sans-serif, ...

AND :root --font-mono unchanged

AND test verifies: actual file content of globals.css contains:
  - the line `@theme {`
  - all expected token names
```

## SPEC-HE-T-3 — Tailwind 类可消费新 token

```gherkin
GIVEN @theme block added per SPEC-HE-T-2

WHEN HeroEditorial component uses:
  - className="font-serif"
  - className="text-[var(--text-hero)]"
  - className="tracking-[var(--tracking-tight)]"
  - className="leading-[var(--leading-display)]"

THEN browser renders with:
  - body text uses Inter via --font-sans → var(--font-inter) chain
  - h1 in HeroEditorial uses Source Serif 4 via font-serif → var(--font-serif) → var(--font-source-serif)
  - h1 font-size at lg breakpoint approaches 9rem (clamp upper)
  - Tracking and leading apply as expected

Test (jsdom can't render fonts, but can assert classNames present):
  - render(<HeroEditorial />)
  - expect h1 to have className "font-serif"
  - expect h1 to have className matching pattern for hero-scale text
```

## Acceptance（所有 3 spec）

- next/font 配置正确（display: swap + variable + latin subset）
- @theme block 不与现有 :root 块冲突（独立 token namespace）
- Existing pages (`/`, `/posts`, `/columns`, etc.) 不报字体相关错误
- typecheck 全绿（next/font types 不漏）
- lint 全绿（无 import 顺序违规等）

## Cascade impact

引入新字体会让 layout.tsx 的 className 变化。所有页面（site + admin）共享 layout，所以新字体 var 会广播到全部页面，但：
- Tailwind 类 `font-sans` / `font-serif` / `font-mono` 仍按各自 var 解析
- 现有 component 用的 `font-sans`（Inter chain）自动获得 Inter 优先，符合 Editorial 整体方向
- mono component 不变
- Admin component 的字体不会"突然变 Inter"——它们之前的 `font-sans` 渲染就是 Geist Sans；现在是 Inter（视觉上字距 / x-height 微变，但都是几何 sans，差异可接受）

如果发现 admin 视觉回归不可接受（实测后），design-notes 提供 fallback：用 `font-[var(--font-geist-sans)]` 类硬绑定 admin 区域到 Geist Sans。
