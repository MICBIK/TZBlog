# design-notes — github-data-card

## ASCII mockup

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  GITHUB · DEVELOPMENT                                            │
│  ──                                                              │
│                                                                  │
│  ┌──┐  ha1den                                                   │
│  │  │  Building TZBlog from scratch                              │
│  └──┘  (bio if present, --text-base muted)                      │
│                                                                  │
│  Recent commits, last 7 days                                     │
│  42                       (huge --text-h2 number)                │
│                                                                  │
│  ──                                                              │
│                                                                  │
│  TOP REPOS                                                       │
│                                                                  │
│  TZBlog              ★ 3   TypeScript                            │
│  This personal blog                                              │
│                                                                  │
│  another-repo        ★ 12  Python                                │
│  Some sentence                                                   │
│                                                                  │
│  yet-another         ★ 5   Rust                                  │
│  Maybe a CLI                                                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Fallback:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  GITHUB · DEVELOPMENT                                            │
│  ──                                                              │
│                                                                  │
│  GitHub data unavailable                                         │
│  Visit github.com/ha1den ↗                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Locked decisions

R1-R8 详 proposal。重申 critical：
- **Anonymous Public API + ISR 1h** locked
- **Fallback in component**, not error boundary
- **No octokit / no SDK** — native fetch only
- **GITHUB_USERNAME** already in env.ts (no change)

## Service skeleton

```ts
import { env } from "@/lib/env"
import {
  githubUserSchema,
  githubReposResponseSchema,
  githubEventsResponseSchema,
} from "@/lib/schemas/github"

type GithubData = {
  status: "ok"
  user: { /* ... */ }
  recentCommitCount: number
  topRepos: Array<{ /* ... */ }>
}

type GithubUnavailable = {
  status: "unavailable"
  reason: "missing_env" | "rate_limited" | "user_not_found" | "upstream_error" | "parse_error" | "network_error"
}

const API_BASE = "https://api.github.com"
const HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "tzblog/1.0",
}
const ISR_CACHE = { next: { revalidate: 3600 } } as const

export async function getGithubData(): Promise<GithubData | GithubUnavailable> {
  const username = env.GITHUB_USERNAME
  if (!username) {
    console.warn("[github] GITHUB_USERNAME not set; returning unavailable")
    return { status: "unavailable", reason: "missing_env" }
  }

  try {
    const [userRes, reposRes, eventsRes] = await Promise.all([
      fetch(`${API_BASE}/users/${username}`, { headers: HEADERS, ...ISR_CACHE }),
      fetch(`${API_BASE}/users/${username}/repos?sort=stars&per_page=3`, { headers: HEADERS, ...ISR_CACHE }),
      fetch(`${API_BASE}/users/${username}/events/public`, { headers: HEADERS, ...ISR_CACHE }),
    ])

    if (userRes.status === 404) {
      console.warn(`[github] user not found: ${username}`)
      return { status: "unavailable", reason: "user_not_found" }
    }

    if (userRes.status === 403 && userRes.headers.get("X-RateLimit-Remaining") === "0") {
      console.warn("[github] rate limited")
      return { status: "unavailable", reason: "rate_limited" }
    }

    if (!userRes.ok || !reposRes.ok || !eventsRes.ok) {
      console.warn("[github] upstream error", { userStatus: userRes.status, reposStatus: reposRes.status, eventsStatus: eventsRes.status })
      return { status: "unavailable", reason: "upstream_error" }
    }

    const user = githubUserSchema.parse(await userRes.json())
    const repos = githubReposResponseSchema.parse(await reposRes.json())
    const events = githubEventsResponseSchema.parse(await eventsRes.json())

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentCommitCount = events
      .filter(e => e.type === "PushEvent" && new Date(e.created_at).getTime() >= sevenDaysAgo)
      .reduce((sum, e) => sum + (e.payload.size ?? e.payload.commits?.length ?? 0), 0)

    return {
      status: "ok",
      user: {
        login: user.login,
        name: user.name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
        public_repos: user.public_repos,
        followers: user.followers,
      },
      recentCommitCount,
      topRepos: repos.map(r => ({
        name: r.name,
        html_url: r.html_url,
        description: r.description,
        stargazers_count: r.stargazers_count,
        language: r.language,
      })),
    }
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      console.warn("[github] schema parse error", err.message)
      return { status: "unavailable", reason: "parse_error" }
    }
    console.warn("[github] network or unknown error", err)
    return { status: "unavailable", reason: "network_error" }
  }
}
```

## Component skeleton

```tsx
import { getGithubData } from "@/lib/services/github"

export async function GithubCard() {
  const data = await getGithubData()

  return (
    <section aria-labelledby="github-heading" className="space-y-6">
      <header className="space-y-2">
        <p
          id="github-heading"
          className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg"
        >
          GitHub · Development
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
      </header>

      {data.status === "ok" ? (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <img
              src={data.user.avatar_url}
              alt={`${data.user.login} avatar`}
              width={48}
              height={48}
              loading="lazy"
              className="rounded-full"
            />
            <div className="space-y-1">
              <a
                href={data.user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-fg text-[var(--text-base)] hover:underline"
              >
                {data.user.name ?? data.user.login}
              </a>
              {data.user.bio && (
                <p className="text-muted-fg text-sm leading-[var(--leading-body)]">
                  {data.user.bio}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg">
              Recent commits, last 7 days
            </p>
            <p className="font-serif text-[var(--text-h2)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg">
              {data.recentCommitCount}
            </p>
          </div>

          <div className="h-px w-full border-t border-border" aria-hidden="true" />

          <div className="space-y-4">
            <p className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg">
              Top repos
            </p>
            <ul className="space-y-3">
              {data.topRepos.map(repo => (
                <li key={repo.name}>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block space-y-1 hover:underline"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-fg">{repo.name}</span>
                      <span className="text-muted-fg text-sm">★ {repo.stargazers_count}</span>
                      {repo.language && (
                        <span className="text-muted-fg text-sm">{repo.language}</span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-muted-fg text-sm leading-[var(--leading-body)]">
                        {repo.description}
                      </p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-muted-fg">GitHub data unavailable</p>
          <p className="text-muted-fg text-sm">
            {data.reason === "missing_env"
              ? "Set GITHUB_USERNAME in .env to enable this card."
              : `Reason: ${data.reason}. Try again later.`}
          </p>
        </div>
      )}
    </section>
  )
}
```

## ha1den 上线前 reminder

handoff.md 提醒 ha1den：
- 在 `.env.production` 或 Docker secrets 设 `GITHUB_USERNAME=<your-handle>`
- 第一次访问 / 触发 cache warm（500ms-2s）
- 此后 ISR 1h 缓存，无感

## Anti-template checklist

- [x] Hairline label
- [x] Rule line
- [x] Editorial typography (serif name + sans/mono meta)
- [x] Big number 数据高亮
- [x] 真链接 hover state
- [x] CSS vars 仅

## 不要做的事

- 不装 octokit
- 不用 GitHub PAT (R1)
- 不抛错到 page level (R2)
- 不加 link rel="me" 等高级 SEO
- 不加 GraphQL API（needs auth）
- 不动 schema
