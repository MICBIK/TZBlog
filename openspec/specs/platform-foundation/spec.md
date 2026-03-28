# platform-foundation Specification

## Purpose

Define the locked product and architecture baseline for TZBlog so future changes can evolve from a stable full-stack, content-first foundation.

## Requirements

### Requirement: TZBlog SHALL use the locked full-stack architecture
TZBlog SHALL use Astro as the web frontend, Payload CMS as the content backend, and PostgreSQL as the primary database.

#### Scenario: Foundation setup begins
- **WHEN** a new implementation phase is started
- **THEN** the project uses Astro, Payload CMS, and PostgreSQL as the baseline stack

### Requirement: TZBlog SHALL support the locked content model
TZBlog SHALL support `posts`, `projects`, `docs`, `notes`, and `pages` as primary content entities, with shared site settings managed centrally.

#### Scenario: Content schema is initialized
- **WHEN** collections and globals are created in the CMS
- **THEN** the primary content entities and shared site settings are present in the content model

### Requirement: TZBlog SHALL remain content-first under a cosmic visual theme
TZBlog SHALL prioritize readable content delivery and clear information architecture, while using the cosmic theme as an enhancement layer rather than the main business flow.

#### Scenario: Homepage experience is implemented
- **WHEN** the homepage and detail pages are designed or built
- **THEN** content discovery and reading remain primary and heavy visual effects do not block the content flow

### Requirement: TZBlog SHALL include an operations-ready publishing pipeline
TZBlog SHALL support object storage media, Pagefind-based search, Umami analytics, and a deployment process with rollback capability.

#### Scenario: Operational baseline is prepared
- **WHEN** deployment and publishing capabilities are planned or implemented
- **THEN** media storage, search, analytics, and rollback expectations are included in the system baseline
