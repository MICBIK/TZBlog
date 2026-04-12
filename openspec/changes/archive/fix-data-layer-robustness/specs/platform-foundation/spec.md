# Spec Delta: platform-foundation

## Change: fix-data-layer-robustness

## MODIFIED Requirements

### Requirement: Payload API normalizers SHALL use typed parameters

All Payload API response normalizer functions SHALL accept typed interfaces matching the expected Payload response shape, instead of `Record<string, any>`. This provides compile-time safety when CMS schema changes.

#### Scenario: CMS schema changes a field name

- Given a normalizer uses a typed interface matching the Payload response
- When the field name changes
- Then TypeScript reports a compile-time error instead of silently returning undefined

### Requirement: GitHub repo stats SHALL use individual fallbacks

The `getReposStats` function SHALL use `Promise.allSettled` so that individual repo API failures return fallback data while successful requests return real data. A single failure SHALL NOT cause all repos to fail.

#### Scenario: One repo API call fails

- Given 3 repos are requested and one returns an error
- When getReposStats resolves
- Then the failed repo shows fallback data while the other 2 show real data
