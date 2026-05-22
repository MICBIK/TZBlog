# specs/component — TechStack 组件

> spec-id 前缀：`SPEC-TS-C`

## SPEC-TS-C-1 — TechStack 渲染所有 5 类目 + 类目内 items

```gherkin
GIVEN TechStack component exists at src/components/site/TechStack.tsx
  AND it contains a locked techStack data structure (per design-notes)

WHEN render(<TechStack />)

THEN exactly 5 category sections render
  AND each section has its hairline label (uppercase, --text-label)
  AND each section has its items listed

categories expected:
- Frontend (Next.js 15, React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui)
- Content & Editor (Tiptap v2, remark + rehype, Shiki)
- Backend & Data (Prisma 7, PostgreSQL 16, Auth.js v5, Zod, MinIO)
- Infra (Docker, Caddy, VPS)
- Tooling (pnpm, Vitest, ESLint, Playwright planned)

Test:
  - render(<TechStack />)
  - expect getByText("FRONTEND") (case-sensitive uppercase)
  - expect getByText("CONTENT & EDITOR")
  - ... per category
  - expect getByText(/Next\.js 15/)
  - expect getByText(/Prisma 7/)
  - ... per item
```

## SPEC-TS-C-2 — 每个 item 渲染 name + note

```gherkin
GIVEN TechStack renders

WHEN inspecting an item element

THEN item has structure:
  <div>
    <span class="font-serif text-fg">{name}</span>
    <span class="font-sans text-muted-fg text-sm">— {note}</span>
  </div>

OR equivalent presentation conveying name + note distinction

Test:
  - render(<TechStack />)
  - find item "Next.js 15"
  - expect parent / sibling element contains note text like "App Router + RSC"
```

## SPEC-TS-C-3 — Hairline labels styled per Editorial baseline

```gherkin
GIVEN TechStack renders

WHEN inspecting category label

THEN label element has className containing:
  - "text-[var(--text-label)]" or "text-xs"
  - "uppercase"
  - "tracking-[var(--tracking-label)]" or "tracking-wider"
  - "text-muted-fg"
  - font-mono OR font-sans (per design-notes lock)

Test:
  - find getByText("FRONTEND")
  - expect className to match pattern
```

## SPEC-TS-C-4 — Responsive grid for items

```gherkin
GIVEN TechStack renders

WHEN inspecting category items wrapper

THEN wrapper has className containing:
  - "grid"
  - "grid-cols-1"
  - "sm:grid-cols-2"
  - "lg:grid-cols-3"
  - "gap-*" (some gap spec)

Test:
  - find category container by aria-labelledby or testid
  - expect items wrapper className to contain "grid-cols-1" "sm:grid-cols-2" "lg:grid-cols-3"
```

## SPEC-TS-C-5 — Rule line separator between categories

```gherkin
GIVEN TechStack renders with 5 categories

WHEN inspecting DOM structure

THEN there are rule line elements separating categories (4 separators between 5)
  AND each rule line has className "h-px border-t border-border" or equivalent

OR alternative: each category has top rule line (5 rules total, with first being section start)

Test:
  - render(<TechStack />)
  - count elements matching pattern containing "border-t border-border"
  - expect count >= 4 (separators) or count == 5 (if leading rules)
```

## Acceptance (all C specs)

- Renders deterministically (same DOM order as data)
- Semantic HTML: each category in `<section>` with `<h3>` or `<h2>` heading
- aria-labelledby pattern preferred for sections
- No hardcoded color values
- No new design tokens introduced (reuse hero-editorial baseline)
- typecheck + lint clean

## Locked data structure (in design-notes; spec references it)

See design-notes for the exact `const techStack: TechCategory[] = [...]` array. The component must render it deterministically.
