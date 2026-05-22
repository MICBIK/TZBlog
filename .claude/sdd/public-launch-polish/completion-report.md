# public-launch-polish completion report

## Completed

- Markdown renderer now supports GitHub-style alerts: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, and `CAUTION`.
- Public post rendering, server preview, and editor preview now use the project-owned `.markdown-body` reading system instead of relying on unavailable typography plugin defaults.
- Markdown reading CSS now covers headings, paragraphs, links, inline code, Shiki code blocks, blockquotes, lists, tables, horizontal rules, and alert variants.
- Homepage now includes `LaunchNarrative` with project architecture, editorial pipeline, and operations direction.
- About page now includes `Principles` with concrete TZBlog implementation and ownership principles.
- Admin layout light-mode sidebar/header text now uses foreground tokens (`text-muted-fg` / `text-fg`) instead of the muted surface color.
- i18n has been recorded as KI-004: current implementation is still single locale; full route/dictionary/metadata/RSS/sitemap migration is V3 independent SDD scope.
- Browser audit found a typography regression in generated Tailwind classes; fixed by replacing unresolved arbitrary CSS-variable typography utilities with Tailwind v4 generated token utilities (`text-hero`, `leading-display`, `tracking-label`, etc.).

## Browser Audit

Screenshots saved in this SDD directory:

- `home-audit.png` — initial home audit, exposed too-small typography and narrow launch cards.
- `home-audit-fixed.png` / `home-audit-fixed-2.png` — typography and layout fix verification.
- `about-audit.png` — About page hierarchy and Principles verification.
- `posts-audit.png` — Posts list verification.
- `admin-audit.png` — Admin sidebar contrast verification.
- `editor-audit-before.png` — Admin post editor verification.
- `home-final.png` / `about-final.png` / `posts-final.png` / `login-final.png` — production-mode verification on `localhost:3001` after the Tailwind scanner fix.

Observed page results:

- `/`: hero typography restored to real `text-hero` scale; LaunchNarrative renders 3 readable cards and orbit decoration.
- `/about`: 1 h1 + 4 h2 sections render correctly; Principles section and launch panels are present.
- `/posts`: published post list renders normally with current seeded content.
- `/admin`: authenticated dashboard renders; light-mode sidebar text is readable (`rgb(107, 114, 128)`) and no longer uses the muted surface token.
- `/admin/posts/new`: preview pane uses `.markdown-body`; editor toolbar remains functional.

Final production smoke notes:

- `pnpm build` no longer emits CSS optimization warnings after removing Tailwind-scannable wildcard class text from SDD reporting and changing the regression test token construction.
- Production `next start` on `localhost:3001` rendered `/`, `/about`, `/posts`, and `/login` successfully; browser measurements found no horizontal overflow on those pages.
- About final audit: h1 computed at `83.2px`, headings were `Shipping software...`, `Now`, `Story`, `Principles`, and `Contact`; `.launch-panel` count was 3.
- Home final audit: h1 computed at `121.6px`; `.launch-surface` / `.launch-panel` count was 4.
- Existing `localhost:3000` dev server was a stale Turbopack process that still served the old invalid wildcard candidate CSS and returned a dev overlay. A second dev instance on `3002` could not start because Next.js locks one dev server per project. Final public verification therefore used production `3001`, while admin visual verification is represented by the earlier valid `admin-audit.png` and `editor-audit-before.png` browser captures plus the passing admin layout tests.

## Deferred / Recorded Debt

- Admin post editor still uses Tiptap `contenteditable` as the editing surface, not a literal source `<textarea>`. This is already covered by `systemPatterns.md` §14 and should remain a separate `editor-source-mode` SDD if the editor is replaced. This task only improved Markdown rendering/preview and did not rewrite editor storage or toolbar behavior.
- The client-side preview remains the lightweight mini-renderer. V2 should evaluate `marked` + `DOMPurify` so the live preview matches server Markdown more closely without weakening sanitize guarantees.
- Full multilingual support remains V3: `app/[lang]`, dictionaries, locale-aware services, metadata, RSS, sitemap, OG images, canonical, and alternate links.

## Verification

- Targeted RED/GREEN tests were run for Markdown reading, admin contrast, site polish, docs/i18n roadmap, and typography token regression.
- Full quality gates passed after the final Tailwind scanner fix: `pnpm vitest run src/app/globals.test.ts`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
- One known warning remains: `pg@9` deprecation warning during tests, already tracked in `memory-bank/progress.md`.
