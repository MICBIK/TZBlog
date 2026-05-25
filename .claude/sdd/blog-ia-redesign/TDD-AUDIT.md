# TDD Compliance Audit — blog-ia-redesign

> Generated: 2026-05-25

## Compliant

- admin-entry ee-001~015 (scope typo on ee-015 pending fix)
- editor-milkdown editor-001~018
- public-shell shell-001~010 (remediated 2026-05-25)

## Violations & remediation

| Issue | Fix |
|-------|-----|
| e6ac7ea bundled theme impl+tests | Replay theme-001~014 pairs |
| ee-015 scope `editor` | Reword to `admin-entry` |
| theme-012 missing e2e | Add theme-contrast.spec.ts |
| theme-008 fn name drift | Rename to reducedMotionDisablesAuroraDrift |
| theme-001 html attribute | Add rootLayoutSetsHtmlAuroraTheme test |
