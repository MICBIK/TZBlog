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

### Requirement: TZBlog homepage SHALL use a simplified 5-section structure with no duplicate navigation entries

The homepage SHALL present exactly 5 focused sections (Hero Identity, GitHub Activity, Recent Posts, About/Tech Stack, Site Stats) and SHALL NOT duplicate navigation entries that already exist in the site header.

#### Scenario: Homepage sections are rendered

- **WHEN** the homepage is loaded
- **THEN** the page contains exactly 5 content sections and no navigation link appears more than once in the page body

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

### Requirement: TZBlog homepage SHALL present a clear personal identity section

The homepage SHALL include a Hero section that displays the site owner's name, role/title, and social links (GitHub, Email, RSS) as the primary identity layer.

#### Scenario: User lands on homepage

- **WHEN** the homepage is rendered
- **THEN** users can immediately identify who owns this blog and how to connect externally

### Requirement: TZBlog homepage SHALL display GitHub activity data

The homepage SHALL include a contribution heatmap showing the last 12 months of GitHub contributions, along with summary metrics.

#### Scenario: User views GitHub activity section

- **WHEN** the GitHub activity section loads
- **THEN** users can see a visual calendar heatmap and key contribution metrics

### Requirement: TZBlog homepage SHALL display open-source project cards with live star counts

The homepage SHALL display curated open-source projects with real-time stargazer counts fetched from GitHub REST API.

#### Scenario: Project stats are displayed

- **WHEN** the projects section renders
- **THEN** each project card shows name, description, language tag, and current star count

### Requirement: TZBlog homepage SHALL display site analytics from Umami

The homepage SHALL show a statistics bar with total pageviews, total visitors, today's pageviews, and today's visitors, fetched from Umami Analytics API.

#### Scenario: Site stats are displayed

- **WHEN** the stats section renders
- **THEN** users can see both cumulative and daily traffic metrics

### Requirement: TZBlog web frontend SHALL use a component-based template system to eliminate structural duplication

The Astro web frontend SHALL provide reusable components for recurring layout patterns (three-column scaffold, article body, detail sidebar, table of contents, collection header, highlight card) so that each pattern is defined once and consumed by pages through props and named slots.

#### Scenario: A layout pattern is updated

- **WHEN** a developer modifies a shared layout pattern (e.g., three-column grid, article rendering, sidebar metadata)
- **THEN** the change propagates to all pages that use the pattern without requiring manual synchronization across multiple files

### Requirement: TZBlog web frontend SHALL derive navigation links from a single authoritative data source

The web frontend SHALL generate all navigation link lists (header, footer, homepage orbit index) from the shared `navItems` data definition, rather than hardcoding independent link lists in each consumer.

#### Scenario: A navigation item is added or renamed

- **WHEN** a contributor adds, removes, or renames an item in the navigation data source
- **THEN** header, footer, and homepage navigation sections all reflect the change without separate manual edits

### Requirement: TZBlog detail page templates SHALL render content sections uniformly including all supported block types

Detail page templates for posts, projects, docs, and notes SHALL render section IDs, headings, paragraphs, and optional bullet lists uniformly, so that no content block type is silently dropped by a template variant.

#### Scenario: A note entry includes bullet content

- **WHEN** a note entry's section data contains a `bullets` array
- **THEN** the note detail page renders those bullets in the same format as posts, projects, and docs detail pages

### Requirement: TZBlog homepage SHALL prioritize content distribution over pure hero spectacle
The homepage SHALL use the observatory hero as an identity layer, but its primary job SHALL be distributing posts, projects, docs, and updates in a way that feels like a mature long-running blog product.

#### Scenario: User lands on homepage
- **WHEN** the homepage is rendered
- **THEN** the hero provides identity and atmosphere while the surrounding modules clearly expose live content entry points and updates

### Requirement: TZBlog frontend SHALL present a mature observatory interaction language
The frontend SHALL combine low-noise motion, stable navigation, coherent card language, and deep-space visual identity so it feels productized rather than like a sample interface.

#### Scenario: User navigates primary routes
- **WHEN** a user moves between homepage, list pages, and detail pages
- **THEN** the interface shows consistent hierarchy, restrained interaction feedback, and a cohesive observatory visual system

### Requirement: Primary Navigation Structure

The site primary navigation MUST NOT contain a redundant search entry when a dedicated Search Relay CTA already exists in the header.

#### Scenario: Search entry is removed from navItems

- Given the site header is rendered
- When `navItems` is iterated to build the `<nav>` element
- Then no nav link with href `/search` appears inside the `<nav>` element
- And the Search Relay CTA button remains present in the header outside the `<nav>`
- And navigating to `/search` continues to work via the Search Relay button

#### Scenario: Downstream nav filters are unaffected

- Given `footerNavItems` filters out `/search` from `navItems`
- And `mainContentNavItems` filters out `/search` from `navItems`
- When the search entry is removed from `navItems`
- Then `footerNavItems` and `mainContentNavItems` produce identical output as before
- And no footer or content nav link is lost

### Requirement: Hero 3D Planet Surface Quality

The hero planet sphere MUST display procedural crater bump mapping to convey a textured, moon-like surface consistent with the cosmic observatory theme.

#### Scenario: Crater bump map is applied

- Given the SiteLayout Three.js scene is initialized
- When the planet mesh is created
- Then a `bumpMap` generated via Canvas 2D (180 random radial-gradient craters on 1024×512 canvas) is assigned to `MeshStandardMaterial`
- And `bumpScale` is set between 2.0 and 5.0
- And the diffuse color remains in the warm brown-yellow Saturn palette

### Requirement: Hero 3D Planet Ring System

The hero planet ring system MUST be rendered exclusively with particles (no RingGeometry mesh), and MUST have visible volumetric thickness.

#### Scenario: RingGeometry is removed

- Given the SiteLayout Three.js scene is initialized
- When the ring system is built
- Then no `THREE.RingGeometry` mesh exists in the scene
- And no `generateRingTexture` function is called

#### Scenario: Thick particle ring is rendered

- Given the ring particle system is constructed
- When particles are distributed
- Then total particle count is ≥ 60000
- And particles span radial range r = 24 to 52
- And y-axis spread ranges from ±0.6 (inner) to ±2.0 (mid ring), giving visible thickness
- And particle sizes vary randomly between 0.04 and 0.18
- And particle colors use warm sand tones matching the planet palette

### Requirement: Hero 3D Planet Drag Rotation

The hero planet MUST support smooth 360° drag rotation in any direction without gimbal lock or axis flip artifacts.

#### Scenario: Quaternion-based drag accumulation

- Given the user clicks and drags on the viewport
- When horizontal or vertical drag delta is applied
- Then rotation is accumulated via `THREE.Quaternion` multiplication (not Euler angle assignment)
- And horizontal drag rotates around the world Y axis
- And vertical drag rotates around the local X axis
- And rotating past ±90° on any axis produces no direction reversal or lock

#### Scenario: Auto-rotation and mouse parallax coexist with drag quaternion

- Given the planet has a drag quaternion state
- When the animation loop runs
- Then auto Y-rotation is composed with the drag quaternion each frame
- And mouse parallax camera offset continues to function independently

