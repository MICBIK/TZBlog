# specs/integration — TechStack 接入 homepage

> spec-id 前缀：`SPEC-TS-I`

## SPEC-TS-I-1 — homepage renders TechStack at correct position

```gherkin
GIVEN src/app/(site)/page.tsx currently has Tech Stack section at line 46-61 (terminal-style)
  AND TechStack component exists per SPEC-TS-C-*

WHEN executing this spec

THEN page.tsx should:
  - Remove lines 46-61 (the terminal-style Tech Stack section)
  - Remove lines 9-16 (techStack const definition)
  - Add `import { TechStack } from "@/components/site/TechStack"`
  - Render `<TechStack />` at the same position (between Hero and Recent Posts)

AND existing sections remain functional:
  - Hero (HeroEditorial from hero-editorial SDD)
  - Recent Posts (D1 work)
  - Site Stats (D1 work)

Test (in src/app/(site)/page.test.tsx, add new spec):
  - render(await HomePage())
  - expect TechStack-related text visible (e.g., "FRONTEND" category label)
  - expect "$" + "whoami" text NOT visible (old terminal removed)
  - expect existing "Recent Posts" heading still visible
  - expect existing "Site Stats" content still visible
```

## SPEC-TS-I-2 — old techStack const removed cleanly

```gherkin
GIVEN page.tsx had `const techStack = [...]` at lines 9-16

WHEN executing this spec

THEN that const is removed from page.tsx
  AND no lingering import / reference

Test (file-level via grep or simple string check):
  - read src/app/(site)/page.tsx content
  - expect content does NOT contain "const techStack ="
  - expect content does NOT contain "$ whoami"
  - expect content DOES contain "<TechStack />"
```

## Acceptance

- page.tsx 删旧加新不破坏其他 section
- 全套 page.test.tsx regression PASS
- typecheck + lint + build 全绿

## Risk

- 如果 page.test.tsx 现有测试 mock `techStack` const，需调整测试（不再 mock 该 const，因为已移除）
- 移除 unused import 如有
