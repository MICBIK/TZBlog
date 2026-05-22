# Completion Report — github-data-card

> SDD path: `.claude/sdd/github-data-card/`
> Tier: T2 (~0.5 day implementation)
> Visual direction: Editorial (inherits from hero-editorial + tech-stack baseline)
> Completed: 2026-05-22

## TL;DR

Anonymous GitHub data fetcher + Editorial GithubCard wired into homepage between TechStack and Recent Posts. Zero-config (uses existing `GITHUB_USERNAME` env), graceful fallback when env missing / rate-limited / upstream errors. ISR 1h cache keeps anonymous rate limit (60 req/h) well below threshold (worst case ~72 calls/day on cold cache, in practice <<1 per minute under traffic).

## Acceptance evidence

| Gate | Command | Result |
|---|---|---|
| Tests | `pnpm test` | 60 files / 399 passed / 1 skipped |
| Typecheck | `pnpm typecheck` | clean |
| Lint | `pnpm lint` | clean (0 warnings under `--max-warnings 0`) |
| Build | `pnpm build` | success; `/` prerendered static; SSG-time fallback warning observed when env unset (expected) |

## Spec coverage

| Spec ID | Layer | Test | Status |
|---|---|---|---|
| SPEC-GC-S-1 | schema | `githubUserSchema parses real /users response` | ✓ |
| SPEC-GC-S-2 | schema | `githubRepoSchema parses real /repos element` | ✓ |
| SPEC-GC-S-3 | schema | `githubEventSchema parses PushEvent` | ✓ |
| SPEC-GC-S-4 | schema | `schemas reject malformed` | ✓ |
| SPEC-GC-S-5 | schema | `schemas accept nullable bio/description/language` | ✓ |
| SPEC-GC-V-1 | service | `returns ok with user + commits + topRepos on happy path` | ✓ |
| SPEC-GC-V-2 | service | `fetch options include { next: { revalidate: 3600 } }` | ✓ |
| SPEC-GC-V-3 | service | `returns unavailable missing_env when GITHUB_USERNAME absent` | ✓ |
| SPEC-GC-V-4 | service | `returns unavailable user_not_found on 404` | ✓ |
| SPEC-GC-V-5 | service | `returns unavailable upstream_error on 5xx OR parse_error on bad json` | ✓ |
| SPEC-GC-V-6 | service | `returns unavailable rate_limited on 403 + ratelimit header` | ✓ |
| (extra) | service | `returns unavailable network_error when fetch throws` | ✓ |
| SPEC-GC-C-1 | component | `GithubCard success state renders all fields` | ✓ |
| SPEC-GC-C-2 | component | `GithubCard fallback state renders gracefully` | ✓ |
| SPEC-GC-C-3 | component | `GithubCard Editorial styling (hairline, rule line, hierarchy)` | ✓ |
| SPEC-GC-C-4 | component | `GithubCard a11y attrs (avatar width/height/lazy, link rel)` | ✓ |
| SPEC-GC-I-1 | integration | `homepage renders GithubCard between TechStack and Recent Posts` | ✓ |

Net: 16 planned specs + 1 extra (network_error) = 17 specs, all green.

## Commit timeline

```
3959068 test(github-schema): SPEC-GC-S-1..5 zod schemas for GitHub API responses
48cbc36 feat(github-schema): SPEC-GC-S-1..5 zod schemas for /users + /repos + /events
ac8a471 test(github-service): SPEC-GC-V-1..6 getGithubData with ISR cache + fallback paths
9be2d86 feat(github-service): SPEC-GC-V-1..6 anonymous GitHub data fetcher with ISR + graceful fallback
0c4246b test(github-card):    SPEC-GC-C-1..4 GithubCard success + fallback rendering
089285f feat(github-card):    SPEC-GC-C-1..4 GithubCard component with Editorial styling
168f2e5 test(site-home):      SPEC-GC-I-1 homepage integrates GithubCard
1911f99 feat(site-home):      SPEC-GC-I-1 wire GithubCard into homepage
```

8 production commits, 4 RED/GREEN micro-cycle pairs. TDD cadence enforced by commit-msg hook (passes "✓ TDD 节奏检查通过" on every feat).

## Design decisions delivered vs. proposal

| # | Decision (proposal §Decisions) | Delivered? | Notes |
|---|---|---|---|
| R1 | Anonymous + ISR 1h, no PAT | ✓ | `getGithubData()` uses `{ next: { revalidate: 3600 } }`; headers contain no Authorization (asserted in SPEC-GC-V-2) |
| R2 | Component renders own fallback (not error boundary) | ✓ | `FallbackState` keeps the rest of the homepage intact when the API misbehaves |
| R3 | Simple numerals, no contribution heatmap | ✓ | Recent commit count rendered in `--text-h2` serif highlight |
| R4 | 1h cache TTL | ✓ | hard-coded in `ISR_CACHE` |
| R5 | Schema failure → unavailable, no throw | ✓ | `ZodError` caught → `{ status: "unavailable", reason: "parse_error" }` |
| R6 | Missing env → fallback + console.warn | ✓ | Verified by SPEC-GC-V-3 + observed in `pnpm build` output |
| R7 | events API for recent commits | ✓ | filters `PushEvent`, last 7d; `payload.size ?? payload.commits?.length ?? 0` |
| R8 | repos sort=stars per_page=3 | ✓ | `/users/{u}/repos?sort=stars&per_page=3` |

## Behavioural note: parallel vs. sequential fetches

Proposal §What/service line read "依次 fetch user / repos / events". The shipped service fetches `/users/{u}` first, short-circuits to `{ status: "unavailable", reason: "user_not_found" }` on 404, then fetches `/repos` and `/events` in parallel via `Promise.all`. This matches the spec tests (SPEC-GC-V-4 expects only 1 fetch on 404) and is strictly faster on the happy path. No spec was violated. Treat the proposal wording as the original intent and the implementation as the refined contract.

## Files

### New
- `src/lib/schemas/github.ts` — zod schemas for /users, /repos, /events (event payload uses `.passthrough()` to survive upstream additions)
- `src/lib/schemas/github.test.ts` — 5 specs
- `src/lib/services/github.ts` — `getGithubData()` discriminated-union return; 6 unavailable reasons (`missing_env` / `user_not_found` / `rate_limited` / `upstream_error` / `parse_error` / `network_error`)
- `src/lib/services/github.test.ts` — 7 specs (6 planned + 1 explicit network_error)
- `src/components/site/GithubCard.tsx` — async RSC; `SuccessState` + `FallbackState`; Editorial visual; `<img>` (eslint-disabled, by design — next/image would proxy the GitHub avatar URL and break the SPEC-GC-C-4 contract)
- `src/components/site/GithubCard.test.tsx` — 4 specs

### Modified
- `src/app/(site)/page.tsx` — imports `GithubCard`, renders `<GithubCard />` between `<TechStack />` and Recent Posts
- `src/app/(site)/page.test.tsx` — new SPEC-GC-I-1 spec; mocks `@/components/site/GithubCard` with a sync stub (same pattern used for `CommentSection` in `posts/[slug]/page.test.tsx`) because vitest jsdom cannot render an async RSC as a child node

### Dependencies
- No new package installs. Reuses existing `zod` and the project's `env`.

### Environment
- Uses pre-existing optional `GITHUB_USERNAME`. When unset, the homepage shows the fallback hint "Set GITHUB_USERNAME in your environment to surface live activity."

## Manual smoke (recommended before deploy)

```bash
# without env → fallback path
unset GITHUB_USERNAME
pnpm dev   # visit / and verify "GitHub data unavailable" + hint

# with env → live data path
export GITHUB_USERNAME=ha1den
pnpm dev   # visit / and verify avatar / handle / recent commit count / top 3 repos
```

## Out of scope (intentional)

- GitHub PAT mode (R1 — anonymous is sufficient at our scale)
- Contribution heatmap / time-series visuals (R3 — simple numerals chosen for MVP)
- Private repos / commit history
- Octokit SDK
- Multi-user / per-author cards

## Memory-bank touch points

- `memory-bank/progress.md` — mark github-data-card complete; advance Current Focus to next INDEX item (about-page)
- `memory-bank/systemPatterns.md` — *(optional)* document the "async RSC + sync stub in page-level test" pattern that emerged here, in case future async RSCs hit the same jsdom limitation

<!-- 此文件由 finish-feature 收尾产出，最终人审。生成时间：2026-05-22T10:55:00+08:00 -->
