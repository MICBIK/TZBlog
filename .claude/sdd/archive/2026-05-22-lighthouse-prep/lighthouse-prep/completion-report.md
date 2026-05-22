# Completion Report — lighthouse-prep

> Status: complete · last pre-deploy SDD before launch hand-off  
> Branch: `main` (227+ commits ahead of `origin/main`)  
> Range: 033b656 .. 815a6ca

## TL;DR

Pre-deploy hardening + observability shipped: SEO assets (sitemap / robots / manifest / lettermark icon / dynamic OG image route), full root metadata (OG + Twitter), six security headers (HSTS / XFO / XCTO / Referrer-Policy / Permissions-Policy / **CSP-Report-Only**), perf audit (img dims + font-swap + tiptap isolation), and a11y audit (jest-axe with zero critical/serious violations on `/` + `/login`). Lighthouse baseline recorded.

## Acceptance Gates

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0, `--max-warnings 0`) |
| `pnpm test` | PASS — 84 files passed, 454 tests passed, 1 skipped |
| `pnpm build` | PASS — Next build compiled; `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/icon.svg`, `/opengraph-image` all generated; `/tags` static + `/tags/[slug]` dynamic |

## Lighthouse Baseline (`/`, desktop, commit `b6caaa6`)

| Category | Score | Target |
|---|---|---|
| Performance | **89** | ≥ 90 → 1 below target (backlog, non-blocking per R8) |
| Accessibility | **100** | ≥ 95 ✓ |
| Best Practices | **100** | ≥ 95 ✓ |
| SEO | **100** | ≥ 95 ✓ |

| CWV | Value | Target |
|---|---|---|
| LCP | 3.8 s | < 2.5 s ✗ (backlog) |
| FCP | 0.8 s | < 1.5 s ✓ |
| TBT | 20 ms | < 200 ms ✓ |
| CLS | 0 | < 0.1 ✓ |
| Speed Index | 1.3 s | — |

Raw artifacts under `tests/lighthouse-artifacts/` (gitignored). Full notes + re-run command in `tests/lighthouse-baseline.md`.

## A11y Result

Two layers, both green:

- **jest-axe unit tests** (`tests/a11y/homepage.a11y.test.tsx`, `tests/a11y/admin-login.a11y.test.tsx`): 0 critical + 0 serious violations on both `/` and `/login`
- **Lighthouse axe-core**: Accessibility score 100 on `/`

The only critical violation surfaced during RED — `landmark-complementary-is-top-level` on HeroEditorial's nested `<aside>` — was fixed in commit `b6caaa6` by switching the inner wrapper to a generic `<div>` (no visual change, all 7 existing HeroEditorial unit tests still green).

## Spec Coverage

| Spec ID | Layer | Test file | Status |
|---|---|---|---|
| SPEC-LH-S-1 | seo-assets | `src/app/sitemap.test.ts` (extended to assert `/tags` + tag detail URLs) | PASS |
| SPEC-LH-S-2 | seo-assets | `src/app/robots.test.ts` (updated to assert `disallow: ['/admin', '/api']`) | PASS |
| SPEC-LH-S-3 | seo-assets | `src/app/manifest.test.ts` (new) | PASS |
| SPEC-LH-S-4 | seo-assets | `src/app/icon.test.ts` (new) | PASS |
| SPEC-LH-M-1 | seo-metadata | `src/app/layout.metadata.test.ts` | PASS |
| SPEC-LH-M-2 | seo-metadata | `src/app/layout.metadata.test.ts` | PASS |
| SPEC-LH-M-3 | seo-metadata | `src/app/layout.metadata.test.ts` | PASS |
| SPEC-LH-H-1 | security-headers | `tests/next-config-headers.test.ts` | PASS |
| SPEC-LH-H-2 | security-headers | `tests/next-config-headers.test.ts` | PASS |
| SPEC-LH-P-1 | perf-audit | `tests/img-attrs.test.ts` | PASS |
| SPEC-LH-P-2 | perf-audit | `tests/tiptap-isolation.test.ts` (passing as regression guard; site bundle was already Tiptap-free) | PASS |
| SPEC-LH-P-3 | perf-audit | `tests/font-display.test.ts` | PASS |
| SPEC-LH-A-1 | a11y-audit | `tests/a11y/homepage.a11y.test.tsx` (jest-axe) | PASS |
| SPEC-LH-A-2 | a11y-audit | `tests/a11y/admin-login.a11y.test.tsx` (jest-axe) | PASS |

## Commit Timeline

| Commit | Message |
|---|---|
| `033b656` | test(seo-assets): SPEC-LH-S-1..4 sitemap (+ /tags) + robots (+ disallow) + manifest + icon |
| `d480a7e` | feat(seo-assets): SPEC-LH-S-1..4 sitemap (+/tags) + robots disallow + manifest + lettermark icon |
| `007fb86` | test(seo-metadata): SPEC-LH-M-1..3 root layout metadata + OG image + twitter |
| `a20faca` | feat(seo-metadata): SPEC-LH-M-1..3 root metadata + OG image route |
| `88874e0` | test(security-headers): SPEC-LH-H-1..2 security headers + CSP Report-Only |
| `9aa2f50` | feat(security-headers): SPEC-LH-H-1..2 HSTS/XFO/XCTO/Referrer/Permissions + CSP Report-Only |
| `afbc4b3` | test(perf-audit): SPEC-LH-P-1..3 img attrs + tiptap isolation + font swap |
| `1762d3a` | feat(perf-audit): SPEC-LH-P-1..3 add img dimensions + font-display swap |
| `3202c7d` | test(a11y-audit): SPEC-LH-A-1..2 homepage + admin login axe baseline |
| `b6caaa6` | feat(a11y-audit): SPEC-LH-A-1..2 fix HeroEditorial aside landmark nesting |
| `c3f345e` | chore(gitignore): exclude tests/lighthouse-artifacts/ |
| `815a6ca` | docs(lighthouse-baseline): record 2026-05-22 baseline scores [no-tdd] |

12 commits in this SDD (10 RED/GREEN TDD pairs collapsed to 5 + a chore + the baseline docs). One additional `docs(lighthouse-prep): completion report` will follow this file.

## Dependencies Added

| Package | Version | Why |
|---|---|---|
| `jest-axe` | 10.0.0 | `toHaveNoViolations()` matcher for SPEC-LH-A-1..2 |
| `@types/jest-axe` | 3.5.9 | TS types for the matcher |

`pnpm-lock.yaml` committed alongside in `3202c7d`. ha1den had pre-approved the install in the SDD handoff.

## Deviations from SDD

| SDD assumption | Reality | Decision |
|---|---|---|
| `src/app/sitemap.ts` / `src/app/robots.ts` are new files (§A.1 GREEN) | Both already shipped by archived seo-and-feed (commits before 2026-05-22) | Extended rather than rewrote — sitemap now also lists tag URLs, robots gained `disallow: ['/admin', '/api']`. Spec coverage preserved; archive tests + new specs all green. |
| Add `NEXT_PUBLIC_SITE_URL` to `env.ts` | Project already has required `SITE_URL` (server-only) | Reused `env.SITE_URL`. Avoided introducing a duplicate client-prefixed variable. metadata + sitemap + robots all derive from `SITE_URL`. |
| Provide a binary `public/og-default.png` placeholder | `next/og` ImageResponse via `src/app/opengraph-image.tsx` | Implemented the Next.js convention route. Renders a 1200×630 serif lettermark + mono tagline at build/runtime; no binary asset committed. layout metadata references `/opengraph-image`. |
| Performance ≥ 90 | Performance 89 on `/` | Within tolerance of SDD §G ≥ 80; recorded in baseline backlog. LCP 3.8s is the gating sub-metric; non-blocking per R8. |

## 🚨 Post-Launch ACTION REQUIRED (handoff to ha1den)

Sorted by urgency:

1. **Set `SITE_URL` in `.env.production`** — required by `env.ts`'s strict zod schema; sitemap / robots / metadata derive from it. Without it `pnpm build` against the production env will fail at module load.
2. **Flip CSP from `Content-Security-Policy-Report-Only` to `Content-Security-Policy`** — wait ~1 week after launch so real violation reports surface in browser devtools / logs first (proposal R2). Edit `next.config.ts` `SECURITY_HEADERS`, change the header key.
3. **Replace `src/app/opengraph-image.tsx`'s stub render with a designed asset** — current output is a black square with serif "TZBlog" + mono tagline. Social cards will look generic. Either swap to a binary `public/og-default.png` + update `layout.tsx` `openGraph.images[0].url`, or keep the route and design a richer ImageResponse.
4. **Replace `src/app/icon.svg`** — currently 256×256 black background + "TZ" Georgia serif lettermark. Swap for the real logo when design exists.
5. **LCP optimization for `/`** — 3.8 s vs 2.5 s target. Suspected: hero serif font swap. Try preloading the serif subset that covers the headline, or rendering the headline in a system fallback initially.
6. **Re-run Lighthouse on `/posts/[slug]`** — once a real cover image exists. Cover image becomes the LCP element; will likely need `fetchpriority="high"` on the first hero post's cover.
7. **Mobile-profile Lighthouse run** — baseline above is desktop default. Run with `--preset=desktop` and again with mobile-emulation before public announcement.

## File List

### Added (production)

- `src/app/manifest.ts`
- `src/app/manifest.test.ts`
- `src/app/icon.svg`
- `src/app/icon.test.ts`
- `src/app/opengraph-image.tsx`
- `src/app/layout.metadata.test.ts`
- `tests/next-config-headers.test.ts`
- `tests/img-attrs.test.ts`
- `tests/tiptap-isolation.test.ts`
- `tests/font-display.test.ts`
- `tests/a11y/homepage.a11y.test.tsx`
- `tests/a11y/admin-login.a11y.test.tsx`
- `tests/lighthouse-baseline.md`

### Modified

- `src/app/sitemap.ts` — added tag-section iteration
- `src/app/sitemap.test.ts` — added /tags assertions
- `src/app/robots.ts` — added disallow
- `src/app/robots.test.ts` — asserts new disallow
- `src/app/layout.tsx` — expanded metadata (OG image, twitter, description); Geist + Geist_Mono now have `display: 'swap'`
- `next.config.ts` — async headers() with HSTS/XFO/XCTO/Referrer/Permissions + CSP-Report-Only
- `src/components/site/HeroEditorial.tsx` — inner `<aside>` → `<div>` to clear axe landmark-complementary-is-top-level
- `src/app/(site)/posts/[slug]/page.tsx` — cover img `width={1600} height={534}`
- `src/components/site/PostCard.tsx` — cover img `width={1600} height={1000}`
- `src/components/admin/posts/CoverUploader.tsx` — preview img `width={1600} height={1000}`
- `src/components/admin/media/MediaCard.tsx` — preview img `width={600} height={600}` + `loading="lazy"`
- `.gitignore` — adds `tests/lighthouse-artifacts/`
- `package.json` + `pnpm-lock.yaml` — `jest-axe` + `@types/jest-axe` devDeps

## Notes

- `pnpm test` still emits `pg` deprecation warnings (preexisting, not from this SDD).
- `pnpm build` still emits Next middleware + Prisma preview-feature warnings (preexisting, not from this SDD).
- This is the last `pre-deploy` SDD in `.claude/sdd/handoff-pre-deploy/INDEX.md`. ha1den now owns audit + deploy.

<!-- this report finalizes lighthouse-prep on 2026-05-22T19:58:00+08:00 -->
