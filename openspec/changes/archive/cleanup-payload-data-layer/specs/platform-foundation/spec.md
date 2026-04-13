## MODIFIED Requirements

### Requirement: Payload data layer SHALL use a single explicit API URL without fallback chain

The `API_URL` in `payload.ts` SHALL be derived solely from `PAYLOAD_API_URL` with a default of `http://localhost:3000/api`. The legacy `PAYLOAD_PUBLIC_URL` fallback SHALL be removed.

#### Scenario: API URL resolution

- **WHEN** the Astro build reads the Payload API URL
- **THEN** it uses `PAYLOAD_API_URL` env var or falls back to `http://localhost:3000/api`

### Requirement: Payload data layer SHALL NOT export unused single-document fetch functions

The data layer SHALL only export functions actively consumed by page components. The `getPostBySlug`, `getProjectBySlug`, `getDocBySlug`, and `getNoteBySlug` functions SHALL be removed since detail pages use `getStaticPaths()` + `Astro.props`.

#### Scenario: Unused exports are removed

- **WHEN** a developer inspects `payload.ts` exports
- **THEN** only list-fetch and aggregate functions are exported

### Requirement: Payload data layer SHALL use precise TypeScript types instead of generic key-value maps

All Payload document interfaces SHALL use field-specific types (e.g., `{ tag: string }`) instead of `{ [key: string]: string | undefined }`.

#### Scenario: Type precision

- **WHEN** TypeScript compiles the data layer
- **THEN** all document fields are typed with their exact shape and no `any` or index-signature types remain
