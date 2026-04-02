# Spec Delta: platform-foundation

## Change: fix-remaining-audit-items

## MODIFIED Requirements

### Requirement: UI components SHALL NOT use hardcoded inline styles for reusable patterns

Reusable visual patterns (list padding, link opacity, grid gaps) SHALL be defined as CSS classes in global.css rather than inline style attributes. Z-index values SHALL use CSS custom properties defined in `:root` to maintain a documented stacking scale.

#### Scenario: Developer adds a new bullet list in a detail page

- Given a prose list pattern already exists as `.prose-list` in global.css
- When the developer needs a styled list
- Then they apply the class instead of writing inline styles
- And the visual output matches the existing pattern

### Requirement: Collection filter tags SHALL be derived from live data

Tag filters on collection list pages and search suggestion keywords SHALL be dynamically extracted from the available content data, not hardcoded in the template.

#### Scenario: New tag appears in published posts

- Given a new post is published with tag "Docker"
- When the posts list page rebuilds
- Then "Docker" appears in the tag filter list if it ranks in the top tags by frequency
