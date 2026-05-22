# test-map.md — hero-editorial

> spec-id → test 函数 + 文件路径 + 层级

## typography-system

| spec-id | 测试函数名 | 文件 | 层级 |
|---|---|---|---|
| SPEC-HE-T-1 | `layout includes Source Serif 4 and Inter font variables on <html>` | `src/app/layout.test.tsx` | jsdom |
| SPEC-HE-T-2 | `globals.css contains @theme block with editorial tokens` | `src/app/globals.test.ts` | node (fs.readFile) |
| SPEC-HE-T-3 | `HeroEditorial h1 has font-serif className and hero-scale class` | `src/components/site/HeroEditorial.test.tsx` | jsdom |

## hero-component

| spec-id | 测试函数名 | 文件 | 层级 |
|---|---|---|---|
| SPEC-HE-H-1 | `renders single h1 with locked tagline + 2 CTA links (Read Blog / About)` | `src/components/site/HeroEditorial.test.tsx` | jsdom |
| SPEC-HE-H-2 | `root container has lg:grid-cols-[7fr_5fr] asymmetric grid` | 同上 | jsdom |
| SPEC-HE-H-3 | `hairline label renders with uppercase tracking class` | 同上 | jsdom |
| SPEC-HE-H-4 | `dateline renders with serif italic className` | 同上 | jsdom |
| SPEC-HE-H-5 | `rule line element exists with border-t border-border` | 同上 | jsdom |
| SPEC-HE-H-6 | `numbered marginalia exists in aside region` | 同上 | jsdom |

## motion-a11y

| spec-id | 测试函数名 | 文件 | 层级 |
|---|---|---|---|
| SPEC-HE-M-1 | `hero children have data-reveal attribute with staggered --reveal-delay` | `src/components/site/HeroEditorial.test.tsx` | jsdom |
| SPEC-HE-M-2 | `globals.css @media (prefers-reduced-motion: reduce) disables [data-reveal] animation` | `src/app/globals.test.ts` | node (fs.readFile) |

## Page integration

| 验证项 | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| Hero replacement | `homepage renders HeroEditorial (not the old centered template)` | `src/app/(site)/page.test.tsx` | jsdom |
| Recent Posts intact | (existing test) | 同上 | jsdom |
| Site Stats intact | (existing test) | 同上 | jsdom |

## Playwright gap（不可达测试）

| 项 | 应有的测试 | 当前状态 | 处理 |
|---|---|---|---|
| 字体实际加载 | Playwright + screenshot | Playwright 未装 | 文档化 + 推 lighthouse-prep SDD 或 P4 |
| 视觉回归（hero 布局） | Playwright screenshot | 同上 | 同上 |
| 真实 reduce-motion 行为 | Playwright with emulate | 同上 | 同上 |
| Editorial 视觉一致性 | 人眼审视（dev server）| 不可自动化 | manual smoke checklist |

## Test setup 模板

`src/components/site/HeroEditorial.test.tsx`:

```ts
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { HeroEditorial } from "./HeroEditorial"

describe("<HeroEditorial />", () => {
  it("renders single h1 with locked tagline", () => {
    render(<HeroEditorial />)
    const h1 = screen.getByRole("heading", { level: 1 })
    expect(h1).toBeInTheDocument()
    expect(h1.textContent).toContain("Building things") // or locked text
  })

  // ... more it() blocks per spec
})
```

`src/app/globals.test.ts`:

```ts
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("globals.css editorial system", () => {
  const css = readFileSync(
    join(process.cwd(), "src/app/globals.css"),
    "utf-8",
  )

  it("contains @theme block", () => {
    expect(css).toContain("@theme {")
  })

  it("defines --text-hero token", () => {
    expect(css).toMatch(/--text-hero:\s*clamp/)
  })

  // ... per token
})
```

`src/app/layout.test.tsx`:

```ts
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import RootLayout from "./layout"

describe("RootLayout font setup", () => {
  it("html element includes serif and inter font variables", () => {
    const { container } = render(
      <RootLayout>
        <div>test</div>
      </RootLayout>
    )
    const html = container.parentElement // or test via querySelector
    expect(html?.className).toMatch(/font-source-serif/)
    expect(html?.className).toMatch(/font-inter/)
  })
})
```

> Note: RootLayout returns full `<html><body>` shell; testing may require special setup. If standard render() doesn't work, fall back to grepping the layout.tsx source for the import statements (file-level test).

## 全套回归

```bash
pnpm vitest run src/components/site/HeroEditorial.test.tsx
pnpm vitest run src/app/globals.test.ts
pnpm vitest run src/app/(site)/page.test.tsx
pnpm test  # full suite
pnpm typecheck
pnpm lint
pnpm build  # verify production build with new fonts
```
