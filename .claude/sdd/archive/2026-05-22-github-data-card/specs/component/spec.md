# specs/component — GithubCard Editorial RSC

> spec-id 前缀：`SPEC-GC-C`

## SPEC-GC-C-1 — Success state renders all fields

```gherkin
GIVEN getGithubData returns { status: "ok", user, recentCommitCount, topRepos }

WHEN render(<GithubCard />) (async RSC, awaits getGithubData internally)

THEN visible:
  - hairline label "GITHUB · DEVELOPMENT" (uppercase tracking)
  - user.name (or user.login if name is null)
  - user.avatar_url rendered as <img> with alt
  - user.bio (if present)
  - "commits last 7d: {N}" using --text-h2 for the number
  - 3 top repos with name + stars + language

Test (mock getGithubData):
  vi.mock("@/lib/services/github", () => ({
    getGithubData: vi.fn().mockResolvedValue({ status: "ok", user: {...}, recentCommitCount: 42, topRepos: [...] })
  }))
  render(await GithubCard())
  expect(getByText("GITHUB · DEVELOPMENT")).toBeInTheDocument()
  expect(getByText("42")).toBeInTheDocument()
  expect(getAllByRole("link")).toHaveLength(at least 4) // top 3 repos + user profile
```

## SPEC-GC-C-2 — Fallback state renders gracefully

```gherkin
GIVEN getGithubData returns { status: "unavailable", reason: "missing_env" }

WHEN render(<GithubCard />)

THEN renders fallback card:
  - hairline label "GITHUB · DEVELOPMENT" (still visible)
  - placeholder text like "GitHub data unavailable" or "Connect via GitHub →"
  - rule line for consistency
  - NO crash / NO Error UI

AND for other reasons (rate_limited / upstream_error / etc.), same fallback (same UI)
  AND console.warn was called in service (not in component)
```

## SPEC-GC-C-3 — Editorial styling (hairline, rule line, hierarchy)

```gherkin
GIVEN GithubCard renders (success or fallback)

THEN structure includes:
  - hairline label at top with --text-label + uppercase + tracking
  - rule line `border-t border-border w-12` near top
  - big number using --text-h2 (commits count) or --text-h1 (if super prominent)
  - serif body text for repo names
  - mono text for tech/labels
```

## SPEC-GC-C-4 — A11y + image attrs

```gherkin
GIVEN GithubCard renders success

THEN <img> for avatar has:
  - alt attribute (descriptive, e.g., `${user.login} avatar`)
  - explicit width and height (e.g., w-12 h-12 in Tailwind = 48x48)
  - loading="lazy" (not above-fold)

AND links to GitHub user profile + repos have rel="noopener noreferrer" + target="_blank"
```

## Component structure

```tsx
import { getGithubData } from "@/lib/services/github"

export async function GithubCard() {
  const data = await getGithubData()

  return (
    <section aria-labelledby="github-heading" className="space-y-6">
      <header>
        <p className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg">
          GitHub · Development
        </p>
        <div className="h-px w-12 border-t border-border mt-2" aria-hidden="true" />
      </header>

      {data.status === "ok" ? (
        <SuccessState data={data} />
      ) : (
        <FallbackState reason={data.reason} />
      )}
    </section>
  )
}
```
