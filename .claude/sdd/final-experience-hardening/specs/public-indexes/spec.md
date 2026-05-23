# Public Indexes

### SCENARIO: public-index-001

**GIVEN** the site is currently a Chinese single-locale blog
**WHEN** a visitor opens `/tags`
**THEN** the page uses Chinese metadata, heading, section labels, and empty state copy while preserving tag count links.

### SCENARIO: public-index-002

**GIVEN** a column has a cover image
**WHEN** the public column card is rendered
**THEN** the cover is displayed in a stable frame with lazy image loading and the card still works without a cover.

### SCENARIO: public-index-003

**GIVEN** the site is currently a Chinese single-locale blog
**WHEN** a visitor opens a tag detail page
**THEN** the tag detail metadata, eyebrow, count label, and empty state use Chinese copy while preserving post list and pagination behavior.

<!-- Draft auto-generated from explore. Review before use. Generated: 2026-05-24T00:00:00+08:00 -->
