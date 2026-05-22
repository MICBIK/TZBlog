# Lighthouse Baseline — 2026-05-22

URL: http://localhost:3000  
Build: `pnpm build` at commit `b6caaa6` (b6caaa6 feat(a11y-audit): SPEC-LH-A-1..2 fix HeroEditorial aside landmark nesting)  
Tool: `pnpm dlx lighthouse@latest` with `--chrome-flags="--headless=new --no-sandbox" --only-categories=performance,accessibility,best-practices,seo`  
Raw artifacts: `tests/lighthouse-artifacts/baseline.report.{html,json}` (not committed; regenerate locally)

## Scores

| Category | Score | Target | Status |
|----------|-------|--------|--------|
| Performance | **89** | ≥ 90 | 1 point below target — backlog item, not blocking launch (per proposal R8) |
| Accessibility | **100** | ≥ 95 | ✓ |
| Best Practices | **100** | ≥ 95 | ✓ |
| SEO | **100** | ≥ 95 | ✓ |

## Core Web Vitals

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP | **3.8 s** | < 2.5 s | ✗ — needs work; suspected: hero serif font swap timing + cover image LCP candidate when posts exist |
| INP | n/a (lab) | < 200 ms | not measured in lab (field-only); TBT proxy below |
| CLS | **0** | < 0.1 | ✓ |
| FCP | **0.8 s** | < 1.5 s | ✓ |
| TBT | **20 ms** | < 200 ms | ✓ |
| Speed Index | 1.3 s | — | ✓ |

## Accessibility

axe-core via Lighthouse + the jest-axe SPEC-LH-A-1/A-2 unit tests both show zero critical / serious violations on `/` and `/login`. The HeroEditorial `<aside>` → `<div>` change (commit `b6caaa6`) cleared the only landmark-complementary-is-top-level violation.

## Backlog (post-launch, non-blocking)

- [ ] **LCP 3.8 s → < 2.5 s on `/`.** Likely contributor: hero serif headline first paint waits on `Source_Serif_4` swap. Try `preload` font subset, or shorten visible glyph set, or render headline in a system fallback first.
- [ ] Re-run Lighthouse against `/posts/[slug]` once a real cover image exists; cover image will become the LCP element and likely needs `fetchpriority="high"` for the first hero post.
- [ ] Run Lighthouse against `/admin` (behind auth) on a follow-up audit. Not blocking pre-launch.
- [ ] Mobile device emulation profile: this baseline is desktop-default. Add a mobile profile run before public traffic.

## Post-launch ACTION REQUIRED (handoff to ha1den)

| Item | When | Why |
|---|---|---|
| Flip CSP from `Content-Security-Policy-Report-Only` to `Content-Security-Policy` | ~1 week after launch | Need to observe real violation reports first (proposal R2) |
| Replace `/opengraph-image` runtime route with a static designed 1200×630 PNG | when design ready | Current route renders a serif lettermark stub; social cards will look generic |
| Replace `src/app/icon.svg` lettermark with real TZ logo | when design ready | Current SVG is a black square with "TZ" Georgia serif |
| Set `SITE_URL` in `.env.production` to the public origin | before deploy | Required by `env.ts`; sitemap / robots / metadata all derive from it |

## How to re-run

```bash
pnpm build
pnpm start &
sleep 5
pnpm dlx lighthouse http://localhost:3000 \
  --output=html --output=json \
  --output-path=tests/lighthouse-artifacts/baseline \
  --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo \
  --quiet
kill %1
```
