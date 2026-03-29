## ADDED Requirements

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
