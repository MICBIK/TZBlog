# test-map.md — tech-stack-section

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-TS-C-1 | `TechStack renders all 5 category labels and items` | `src/components/site/TechStack.test.tsx` | jsdom |
| SPEC-TS-C-2 | `each item renders with name + note` | 同上 | jsdom |
| SPEC-TS-C-3 | `category labels have Editorial hairline styling` | 同上 | jsdom |
| SPEC-TS-C-4 | `item grid uses responsive cols` | 同上 | jsdom |
| SPEC-TS-C-5 | `rule line separators present` | 同上 | jsdom |
| SPEC-TS-I-1 | `homepage renders TechStack between Hero and Recent Posts` | `src/app/(site)/page.test.tsx` | jsdom |
| SPEC-TS-I-2 | `page.tsx removes old techStack const and terminal section` | `src/app/(site)/page.integration.test.ts` (file-level grep) | node |

## Test setup

`src/components/site/TechStack.test.tsx`:

```ts
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { TechStack } from "./TechStack"

describe("<TechStack />", () => {
  it("renders all 5 category labels", () => {
    render(<TechStack />)
    expect(screen.getByText("FRONTEND")).toBeInTheDocument()
    expect(screen.getByText("CONTENT & EDITOR")).toBeInTheDocument()
    expect(screen.getByText("BACKEND & DATA")).toBeInTheDocument()
    expect(screen.getByText("INFRA")).toBeInTheDocument()
    expect(screen.getByText("TOOLING")).toBeInTheDocument()
  })

  it("renders item with name + note", () => {
    render(<TechStack />)
    expect(screen.getByText("Next.js 15")).toBeInTheDocument()
    expect(screen.getByText(/App Router \+ RSC/)).toBeInTheDocument()
  })

  // ... per spec
})
```

`src/app/(site)/page.test.tsx` extension:

```ts
it("renders TechStack between hero and recent posts", async () => {
  render(await HomePage())
  expect(screen.getByText("FRONTEND")).toBeInTheDocument() // TechStack present
  expect(screen.queryByText(/\$\s*whoami/)).toBeNull() // old terminal removed
})
```

`src/app/(site)/page.integration.test.ts` (file-level grep, node env):

```ts
import { readFileSync } from "node:fs"
import { join } from "node:path"

describe("page.tsx tech-stack integration", () => {
  const src = readFileSync(join(process.cwd(), "src/app/(site)/page.tsx"), "utf-8")

  it("no longer contains terminal-style techStack const", () => {
    expect(src).not.toMatch(/const techStack\s*=/)
    expect(src).not.toMatch(/\$\s*whoami/)
  })

  it("imports and renders TechStack component", () => {
    expect(src).toMatch(/import.*TechStack.*from.*\/components\/site\/TechStack/)
    expect(src).toMatch(/<TechStack\s*\/>/)
  })
})
```
