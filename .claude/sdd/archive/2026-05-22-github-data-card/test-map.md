# test-map.md — github-data-card

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-GC-S-1 | `githubUserSchema parses real /users response` | `src/lib/schemas/github.test.ts` | node |
| SPEC-GC-S-2 | `githubRepoSchema parses real /repos element` | 同上 | node |
| SPEC-GC-S-3 | `githubEventSchema parses PushEvent` | 同上 | node |
| SPEC-GC-S-4 | `schemas reject malformed` | 同上 | node |
| SPEC-GC-S-5 | `schemas accept nullable bio / description / language` | 同上 | node |
| SPEC-GC-V-1 | `getGithubData returns ok with user + commits + topRepos on happy path` | `src/lib/services/github.test.ts` | node |
| SPEC-GC-V-2 | `fetch options include { next: { revalidate: 3600 } }` | 同上 | node |
| SPEC-GC-V-3 | `returns unavailable missing_env when GITHUB_USERNAME absent` | 同上 | node |
| SPEC-GC-V-4 | `returns unavailable user_not_found on 404` | 同上 | node |
| SPEC-GC-V-5 | `returns unavailable upstream_error on 5xx OR parse_error on bad json` | 同上 | node |
| SPEC-GC-V-6 | `returns unavailable rate_limited on 403 + ratelimit header` | 同上 | node |
| SPEC-GC-C-1 | `GithubCard success state renders all fields` | `src/components/site/GithubCard.test.tsx` | jsdom |
| SPEC-GC-C-2 | `GithubCard fallback state renders gracefully` | 同上 | jsdom |
| SPEC-GC-C-3 | `GithubCard Editorial styling (hairline, rule line, hierarchy)` | 同上 | jsdom |
| SPEC-GC-C-4 | `GithubCard a11y attrs (img alt + dimensions, link rel)` | 同上 | jsdom |
| SPEC-GC-I-1 | `homepage renders GithubCard between TechStack and Recent Posts` | `src/app/(site)/page.test.tsx` | jsdom |

## Test setup snippets

### service test (node, mock fetch)

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockReset()
  process.env.GITHUB_USERNAME = "octocat"  // test fixture
})

it("success path", async () => {
  mockFetch
    .mockResolvedValueOnce(new Response(JSON.stringify(userSample), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(reposSample), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(eventsSample), { status: 200 }))

  const { getGithubData } = await import("@/lib/services/github")
  const data = await getGithubData()

  expect(data.status).toBe("ok")
  expect(data.user.login).toBe("octocat")
})
```

### component test (jsdom, mock service)

```ts
vi.mock("@/lib/services/github", () => ({
  getGithubData: vi.fn(),
}))

it("renders success state", async () => {
  const { getGithubData } = await import("@/lib/services/github")
  vi.mocked(getGithubData).mockResolvedValue({
    status: "ok",
    user: { login: "ha1den", name: "ha1den", bio: null, avatar_url: "https://...", html_url: "...", public_repos: 10, followers: 5 },
    recentCommitCount: 42,
    topRepos: [{ name: "TZBlog", html_url: "...", description: "blog", stargazers_count: 3, language: "TypeScript" }],
  })

  const { GithubCard } = await import("./GithubCard")
  render(await GithubCard())

  expect(screen.getByText("42")).toBeInTheDocument()
  expect(screen.getByText("TZBlog")).toBeInTheDocument()
})
```
