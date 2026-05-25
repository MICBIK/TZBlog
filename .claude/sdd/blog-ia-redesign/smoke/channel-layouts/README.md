# Channel Layout × Theme Smoke

5 layouts × 3 themes = **15 combinations** (desktop + mobile each → 30 PNGs).

## Matrix

| Layout | Seed slug | Production theme | Demo-front direction |
|--------|-----------|------------------|--------------------|
| CHRONICLE | `/c/articles` | aurora | `demo-front/demos/ink-garden/` |
| CARDS | `/c/cards` | aurora | `demo-front/demos/aurora-portal/` |
| TIMELINE | `/c/notes` | aurora | `demo-front/demos/aurora-portal/` |
| GREP | `/c/stream` | terminal | `demo-front/demos/terminal-workshop/` |
| FEED | `/c/pulse` | terminal | `demo-front/demos/terminal-workshop/` |

Smoke captures **all three themes per layout** by temporarily setting `data-theme` on `<html>` for visual matrix review (production routing uses `resolveChannelTheme` in `src/app/(site)/c/[slug]/layout.tsx`).

## Regenerate

```bash
pnpm docker:dev          # Postgres
pnpm db:seed             # showcase channels: articles/stream/notes/cards/pulse
pnpm exec playwright test e2e/channel-layout-theme-smoke.spec.ts
```

Output: `{layout}-{theme}-{desktop|mobile}.png` in this directory.

## Manual review checklist

Compare each desktop PNG against the demo direction in the table above:

- [ ] Aurora: glass/soft radius/portal spacing
- [ ] Ink: serif headlines, paper tone, reading rhythm
- [ ] Terminal: mono table/grep, dark field, phosphor accent

Target: ≥ 90% visual alignment per `acceptance-criteria.md` §6.
