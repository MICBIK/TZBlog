# specs/hero-component — HeroEditorial 组件

> spec-id 前缀：`SPEC-HE-H`

## SPEC-HE-H-1 — HeroEditorial 渲染 hero h1 + 2 CTA buttons

```gherkin
GIVEN HeroEditorial component exists at src/components/site/HeroEditorial.tsx

WHEN render(<HeroEditorial />)

THEN exactly 1 <h1> exists
  AND <h1> contains the text "Building things" (or whatever the locked tagline is — see design-notes)
  AND there are exactly 2 <a> elements rendered as button-styled CTAs:
    - "Read Blog" with href="/posts"
    - "About" or "About Me" with href="/about"
  AND <h1> has className containing "font-serif"
  AND <h1> has className referencing --text-hero scale
```

## SPEC-HE-H-2 — Asymmetric grid layout at lg+

```gherkin
GIVEN HeroEditorial component renders

WHEN viewport at lg+ breakpoint

THEN root container has className containing:
  - "lg:grid"
  - "lg:grid-cols-[7fr_5fr]" (or similar 7+5 asymmetric ratio)
  - "lg:gap-*" for spacing

AND mobile (<lg):
  - root container uses block / flex-col stack
  - main area first, aside (signature elements) below

Test:
  - render(<HeroEditorial />)
  - root element has className containing "lg:grid-cols-[7fr_5fr]"
```

## SPEC-HE-H-3 — Hairline label rendered

```gherkin
GIVEN HeroEditorial renders

WHEN inspecting rendered DOM

THEN there exists an element with text content like "BLOG · ISSUE 002 · MAY 2026" (or design-notes-locked variant)
  AND that element's className contains:
    - "tracking-[var(--tracking-label)]" (uppercase tracking 0.12em)
    - "uppercase" or text-transform via CSS var
    - "text-[var(--text-label)]" or similar small size class
  AND positioned in the aside region (right column at lg+, top at mobile)
```

## SPEC-HE-H-4 — Dateline rendered

```gherkin
GIVEN HeroEditorial renders

WHEN inspecting rendered DOM

THEN there exists a <p> or <span> element with text:
  "ha1den · Notes from the field · May 2026" (or design-notes-locked variant)
  AND className contains "font-serif" + "italic"
  AND positioned beneath h1 or in aside
```

## SPEC-HE-H-5 — Rule line element rendered

```gherkin
GIVEN HeroEditorial renders

WHEN inspecting rendered DOM

THEN there exists an element acting as horizontal rule:
  - className contains "w-12" or "w-16" (short width, NOT full)
  - className contains "border-t border-border"
  - placed between h1 and dateline OR at start of aside

Test:
  - render(<HeroEditorial />)
  - expect at least one element with className matching pattern w-(12|16) border-t border-border
```

## SPEC-HE-H-6 — Numbered marginalia rendered

```gherkin
GIVEN HeroEditorial renders

WHEN inspecting aside region

THEN there exists a number marker (e.g., "001" / "001 / NOTES")
  AND positioned visually at top-right (in aside) or as marker for the hero
  AND className uses Editorial small label style
```

## Acceptance (all H specs)

- ARIA: h1 is unique on page
- CTAs are accessible via `getByRole("link", { name: /read blog|about/i })`
- All 4 signature elements present (anti-template checklist ≥4)
- No hardcoded color values; uses var(--accent) / var(--fg) / etc.
- typecheck + lint clean

## Edge cases

- Empty content (no posts/stats) shouldn't break hero (hero is self-contained)
- prefers-color-scheme dark: hero readable (all vars handled)
- prefers-reduced-motion: no transform / opacity animations (covered by SPEC-HE-M-1)
