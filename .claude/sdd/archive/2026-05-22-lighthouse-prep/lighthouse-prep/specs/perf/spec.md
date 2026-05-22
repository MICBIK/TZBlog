# specs/perf — performance audits

> spec-id 前缀：`SPEC-LH-P`

## SPEC-LH-P-1 — all `<img>` have width + height attributes

```gherkin
GIVEN all .tsx files in src/

WHEN grep finds `<img` tags

THEN every match has:
  - width attribute (number)
  - height attribute (number)
  - alt attribute (string)
  - loading attribute ("eager" for above-fold, else "lazy")

Test (string scan):
  import { glob } from "glob"
  for (const file of await glob("src/**/*.tsx")) {
    const content = await readFile(file, "utf-8")
    const imgs = content.matchAll(/<img\b[^>]*\/?>/g)
    for (const m of imgs) {
      expect(m[0]).toMatch(/width=/)
      expect(m[0]).toMatch(/height=/)
      expect(m[0]).toMatch(/alt=/)
    }
  }
```

## SPEC-LH-P-2 — Tiptap editor is dynamic import only in admin

```gherkin
GIVEN any site (non-admin) component imports

WHEN grep `from "@tiptap"` in src/components/site/ + src/app/(site)/

THEN no direct (non-dynamic) imports found

AND admin editor file uses next/dynamic:
  const Editor = dynamic(() => import("./TiptapEditor"), { ssr: false })

Test:
  const siteFiles = await glob("src/{components/site,app/(site)}/**/*.{ts,tsx}")
  for (const file of siteFiles) {
    const content = await readFile(file, "utf-8")
    expect(content).not.toMatch(/from\s+["']@tiptap/)
  }
```

## SPEC-LH-P-3 — font-display swap verified

```gherkin
GIVEN src/app/layout.tsx uses next/font/google

WHEN parsing the font import

THEN options include `display: "swap"` (next/font default but explicit safer)

Test:
  const layout = await readFile("src/app/layout.tsx", "utf-8")
  expect(layout).toMatch(/display:\s*["']swap["']/)
  // or assert next/font/google import + no display: "block"
```

## Manual perf baseline (NO test, documented in completion-report)

After all specs green：

```bash
pnpm build
pnpm start &  # production server
# in another terminal:
pnpm dlx lighthouse http://localhost:3000 --view --output html --output-path tests/lighthouse-baseline.html
```

记录 4 维分数到 `tests/lighthouse-baseline.md`：

```markdown
# Lighthouse Baseline — 2026-05-22

URL: http://localhost:3000

| Category | Score | Notes |
|----------|-------|-------|
| Performance | XX | LCP: Xs, CLS: X, TBT: Xms |
| Accessibility | XX | violations: ... |
| Best Practices | XX | ... |
| SEO | XX | ... |
```
