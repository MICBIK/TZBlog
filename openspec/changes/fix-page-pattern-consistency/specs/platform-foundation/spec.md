# Spec Delta: platform-foundation

## Change: fix-page-pattern-consistency

## MODIFIED Requirements

### Requirement: All collection list pages SHALL display consistent metadata

Every collection list page (posts, projects, docs, notes) SHALL display a count badge in the CollectionHeader showing the number of items. This ensures visual consistency across all collection-type pages.

#### Scenario: Viewing any collection list page

- Given the user navigates to posts, projects, docs, or notes list
- When the page renders
- Then CollectionHeader shows a count badge with item count

### Requirement: Three-column layout SHALL be responsive

The `.layout-firefly` three-column grid SHALL collapse to a single column on viewports narrower than 980px. Sidebars SHALL be hidden on mobile to prevent horizontal overflow and ensure content readability.

#### Scenario: Viewing on mobile device

- Given the viewport width is below 980px
- When a three-column layout page renders
- Then sidebars collapse and main content fills the viewport
