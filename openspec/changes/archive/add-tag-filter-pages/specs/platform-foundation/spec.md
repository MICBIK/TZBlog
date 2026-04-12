# Spec Delta: platform-foundation

## Change: add-tag-filter-pages

## ADDED Requirements

### Requirement: Tags SHALL be navigable links across all collection pages

All tag elements rendered in collection list pages and detail pages SHALL be clickable links pointing to `/tags/[tag]`. Tags SHALL NOT be plain text spans.

#### Scenario: User clicks a tag on a post card

- Given the user is viewing the posts list page
- When they click the "Astro" tag on a post card
- Then the browser navigates to `/tags/Astro`
- And the page displays all content items tagged with "Astro" across all collections

### Requirement: A tag aggregation page SHALL exist at /tags

The site SHALL provide a `/tags` page that lists all unique tags used across all published content (posts, projects, docs, notes), along with the count of items per tag. Tags SHALL be sorted by frequency (most used first).

#### Scenario: User visits the tags page

- Given there are 3 posts tagged "Astro" and 1 doc tagged "Astro"
- When the user visits `/tags`
- Then "Astro" appears with a count of 4
- And clicking "Astro" navigates to `/tags/Astro`

### Requirement: A tag detail page SHALL exist at /tags/[tag]

The site SHALL provide a `/tags/[tag]` page that displays all published content items matching the given tag, grouped by collection type (posts, projects, docs, notes). Empty groups SHALL be omitted.

#### Scenario: Tag has items from multiple collections

- Given "TypeScript" is used in 2 posts and 1 project
- When the user visits `/tags/TypeScript`
- Then the page shows a "文章" section with 2 post cards
- And a "项目" section with 1 project card
- And no "文档" or "笔记" sections appear

### Requirement: Tag filter links on list pages SHALL navigate to tag detail pages

The tag filter sections on collection list pages (e.g., posts Filters sidebar, projects Project Filter sidebar) SHALL use anchor links to `/tags/[tag]` instead of non-interactive elements.

#### Scenario: Posts page filter tags are clickable

- Given the posts list page shows top 5 tags in the Filters sidebar
- When the user clicks a tag
- Then the browser navigates to `/tags/[tag]`
