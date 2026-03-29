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

### Requirement: TZBlog web frontend SHALL expose a full content-first route architecture
The Astro web frontend SHALL provide first-class routes for homepage, post index/detail, project index/detail, docs index/detail, notes index/detail, lab, about, and search so users can discover and browse content without relying on a single-page presentation.

#### Scenario: User navigates primary content routes
- **WHEN** a user opens the web application
- **THEN** primary navigation and route pages exist for content browsing and discovery across posts, projects, docs, notes, lab, about, and search

### Requirement: Homepage SHALL implement the observatory six-section structure
The homepage SHALL include Hero, Focus Stream, Mission Panels, Selected Works, Timeline/Changelog, and Footer Dock sections in a content-first order.

#### Scenario: Homepage is rendered
- **WHEN** the homepage route is loaded
- **THEN** users can identify site identity, key content entry points, featured content, and recent updates in one page flow

### Requirement: Content detail templates SHALL prioritize readability
Detail pages for posts, projects, docs, and notes SHALL present readable primary content with supporting metadata/navigation panels, and maintain usable behavior on desktop and mobile.

#### Scenario: User reads a detail page
- **WHEN** a user opens a detail route
- **THEN** the page provides clear metadata, stable reading width, and auxiliary navigation that does not block primary reading

### Requirement: TZBlog web frontend SHALL provide baseline navigation and metadata semantics
The Astro web frontend SHALL provide baseline navigation semantics, primary-content skip navigation, and page metadata suitable for progressive SEO and accessible browsing.

#### Scenario: User navigates the site with assistive or keyboard-first browsing
- **WHEN** a user moves through the site header and main content
- **THEN** primary navigation exposes the active page state and a skip-to-content path exists

#### Scenario: A page is shared or indexed
- **WHEN** a route is rendered
- **THEN** the page exposes at least title, description, and baseline Open Graph / Twitter metadata, with canonical URL when site URL configuration is available

