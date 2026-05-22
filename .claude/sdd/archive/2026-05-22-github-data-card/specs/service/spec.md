# specs/service — GitHub data fetching service

> spec-id 前缀：`SPEC-GC-V`

## Return type

```ts
type GithubData = {
  status: "ok"
  user: { login, name, bio, avatar_url, html_url, public_repos, followers }
  recentCommitCount: number  // from events last 7d
  topRepos: Array<{ name, html_url, description, stargazers_count, language }>
}

type GithubUnavailable = {
  status: "unavailable"
  reason: "missing_env" | "rate_limited" | "user_not_found" | "upstream_error" | "parse_error" | "network_error"
}

export async function getGithubData(): Promise<GithubData | GithubUnavailable>
```

## SPEC-GC-V-1 — Success path

```gherkin
GIVEN env GITHUB_USERNAME is set to a valid user
  AND GitHub API returns 200 for all 3 endpoints with valid JSON

WHEN getGithubData() called

THEN returns { status: "ok", user, recentCommitCount, topRepos }
  AND user contains login, name, bio, avatar_url, html_url, public_repos, followers
  AND recentCommitCount equals SUM of payload.size for PushEvents in last 7 days (from events response)
  AND topRepos is array of length ≤ 3, sorted by stargazers_count desc (from repos response which is already sorted)
```

## SPEC-GC-V-2 — fetch uses ISR cache

```gherkin
GIVEN any call to getGithubData

WHEN inspecting fetch options

THEN each fetch is called with options { next: { revalidate: 3600 } }
  AND no manual cache layer (rely on Next.js fetch cache)

Test: mock fetch and assert call args contain `next.revalidate === 3600`
```

## SPEC-GC-V-3 — missing GITHUB_USERNAME → unavailable

```gherkin
GIVEN env GITHUB_USERNAME is undefined

WHEN getGithubData()

THEN returns { status: "unavailable", reason: "missing_env" }
  AND no fetch called
  AND console.warn called with helpful message
```

## SPEC-GC-V-4 — 404 user not found

```gherkin
GIVEN GitHub /users/{u} returns 404

WHEN getGithubData()

THEN returns { status: "unavailable", reason: "user_not_found" }
  AND console.warn called
  AND no further endpoints called (short-circuit)
```

## SPEC-GC-V-5 — 5xx or zod parse error → upstream_error / parse_error

```gherkin
GIVEN GitHub /users/{u} returns 500 OR returns 200 with malformed JSON

WHEN getGithubData()

THEN returns { status: "unavailable", reason: "upstream_error" } OR "parse_error"
  AND console.warn called with error context
```

## SPEC-GC-V-6 — rate limit (403 with X-RateLimit-Remaining: 0)

```gherkin
GIVEN GitHub returns 403 with header X-RateLimit-Remaining: 0

WHEN getGithubData()

THEN returns { status: "unavailable", reason: "rate_limited" }
  AND console.warn called
```

## Network error handling

```gherkin
GIVEN fetch throws (network unreachable)

WHEN getGithubData()

THEN catches error
  AND returns { status: "unavailable", reason: "network_error" }
  AND console.warn called
  AND does NOT bubble error to caller
```

## API endpoints (locked)

- `GET https://api.github.com/users/{username}` — user profile
- `GET https://api.github.com/users/{username}/repos?sort=stars&per_page=3` — top 3 starred
- `GET https://api.github.com/users/{username}/events/public` — recent events for commit count

## Headers (anonymous, public API)

- `Accept: application/vnd.github+json`
- `User-Agent: tzblog/1.0`
- NO Authorization header (anonymous)

## Recent commit count calculation

```ts
const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
const recentPushes = events.filter(
  e => e.type === "PushEvent" && new Date(e.created_at).getTime() >= sevenDaysAgo
)
const recentCommitCount = recentPushes.reduce(
  (sum, e) => sum + (e.payload.size ?? e.payload.commits?.length ?? 0),
  0
)
```
