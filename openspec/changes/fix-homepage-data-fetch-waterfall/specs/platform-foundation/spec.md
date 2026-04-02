# Spec Delta: platform-foundation

## Change: fix-homepage-data-fetch-waterfall

## MODIFIED Requirements

### Requirement: TZBlog homepage SHALL fetch all external data in parallel

The homepage data-fetching layer SHALL execute all independent external API calls (GitHub GraphQL, GitHub REST, Payload CMS, Umami) concurrently via `Promise.all`, rather than sequentially. No artificial delays (e.g., `setTimeout`) SHALL be inserted between requests that are well within API rate limits.

#### Scenario: All APIs are available

- Given GitHub API, Payload CMS, and Umami are reachable
- When the homepage is built or rendered
- Then all 4 groups of API calls execute concurrently
- And total data-fetch time approximates the slowest single call, not the sum of all calls
- And the rendered result is identical to sequential execution

#### Scenario: One API is slow or unavailable

- Given one of the external APIs has high latency or is unreachable
- When the homepage is built
- Then the other API calls complete independently without waiting for the slow one
- And the slow/failed section renders its fallback/empty state
- And unaffected sections render normally
