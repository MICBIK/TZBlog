## ADDED Requirements

### Requirement: TZBlog web frontend SHALL provide baseline navigation and metadata semantics
The Astro web frontend SHALL provide baseline navigation semantics, primary-content skip navigation, and page metadata suitable for progressive SEO and accessible browsing.

#### Scenario: User navigates the site with assistive or keyboard-first browsing
- **WHEN** a user moves through the site header and main content
- **THEN** primary navigation exposes the active page state and a skip-to-content path exists

#### Scenario: A page is shared or indexed
- **WHEN** a route is rendered
- **THEN** the page exposes at least title, description, and baseline Open Graph / Twitter metadata, with canonical URL when site URL configuration is available
