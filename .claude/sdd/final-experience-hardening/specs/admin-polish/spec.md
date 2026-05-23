# Admin Polish

### SCENARIO: admin-polish-001

**GIVEN** the admin dashboard has no analytics rows yet
**WHEN** metric helper components render empty states
**THEN** the visible empty state copy and chart accessible label use Chinese site chrome instead of English placeholders.

### SCENARIO: admin-polish-002

**GIVEN** the admin dashboard renders traffic widgets and range controls
**WHEN** an admin visits `/admin`
**THEN** the page title, helper copy, section labels, range links, widget titles, and failure fallbacks use Chinese single-locale chrome.

<!-- Draft auto-generated from explore. Review before use. Generated: 2026-05-24T00:00:00+08:00 -->
