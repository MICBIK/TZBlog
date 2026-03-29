## ADDED Requirements

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
