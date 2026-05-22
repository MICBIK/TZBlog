# specs/schema — GitHub API zod schemas

> spec-id 前缀：`SPEC-GC-S`

## SPEC-GC-S-1 — githubUserSchema parses /users/{u} response

```gherkin
GIVEN a real GitHub /users/{u} JSON response (sample below)
WHEN githubUserSchema.parse(json)
THEN returns typed object containing: login, name, bio, avatar_url, public_repos, followers, html_url
```

Real sample:
```json
{
  "login": "octocat",
  "id": 1,
  "node_id": "MDQ6VXNlcjE=",
  "avatar_url": "https://github.com/images/error/octocat_happy.gif",
  "html_url": "https://github.com/octocat",
  "name": "monalisa octocat",
  "bio": "There once was...",
  "public_repos": 2,
  "followers": 20,
  "following": 0
}
```

Schema:
```ts
export const githubUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  bio: z.string().nullable(),
  avatar_url: z.string().url(),
  public_repos: z.number(),
  followers: z.number(),
  html_url: z.string().url(),
})
```

## SPEC-GC-S-2 — githubRepoSchema parses single repo

```gherkin
GIVEN a real GitHub /repos JSON response element
WHEN githubRepoSchema.parse(json)
THEN returns typed object with: name, html_url, description, stargazers_count, language
```

Real sample:
```json
{
  "name": "Hello-World",
  "full_name": "octocat/Hello-World",
  "html_url": "https://github.com/octocat/Hello-World",
  "description": "This your first repo!",
  "stargazers_count": 80,
  "language": "JavaScript"
}
```

Schema:
```ts
export const githubRepoSchema = z.object({
  name: z.string(),
  html_url: z.string().url(),
  description: z.string().nullable(),
  stargazers_count: z.number(),
  language: z.string().nullable(),
})

export const githubReposResponseSchema = z.array(githubRepoSchema)
```

## SPEC-GC-S-3 — githubEventSchema parses event (focus on PushEvent)

```gherkin
GIVEN GitHub /events/public response array element
WHEN githubEventSchema.parse(json)
THEN returns typed object with: type, created_at, payload (containing commits for PushEvent)
```

Real sample (PushEvent):
```json
{
  "id": "22249084947",
  "type": "PushEvent",
  "created_at": "2022-06-09T12:47:28Z",
  "payload": {
    "size": 3,
    "commits": [
      { "sha": "...", "message": "..." }
    ]
  }
}
```

Schema:
```ts
export const githubEventSchema = z.object({
  type: z.string(),
  created_at: z.string(),
  payload: z.object({
    size: z.number().optional(),
    commits: z.array(z.object({
      sha: z.string(),
      message: z.string(),
    })).optional(),
  }).passthrough(),
})

export const githubEventsResponseSchema = z.array(githubEventSchema)
```

## SPEC-GC-S-4 — Schema rejects malformed response

```gherkin
GIVEN malformed JSON (e.g., user without `login`, repos as non-array)
WHEN parse called
THEN throws ZodError
AND service layer treats as unavailable (per SPEC-GC-V-5)
```

## SPEC-GC-S-5 — Schema accepts nullable optional fields

```gherkin
GIVEN GitHub user with bio: null
WHEN parse
THEN succeeds (bio is nullable)

GIVEN GitHub repo with description: null, language: null
WHEN parse
THEN succeeds
```
