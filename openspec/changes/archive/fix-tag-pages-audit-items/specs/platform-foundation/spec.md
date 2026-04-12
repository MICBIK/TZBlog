# Spec Delta: platform-foundation

## Change: fix-tag-pages-audit-items

## MODIFIED Requirements

### Requirement: Tag URLs SHALL be encoded for special characters

All tag href attributes SHALL use `encodeURIComponent(tagName)` to ensure URL safety. Tag names containing `#`, `&`, `?`, spaces, or non-ASCII characters SHALL produce valid URLs that correctly resolve to the corresponding tag detail page.

#### Scenario: Tag name contains special characters

- Given a tag named "C#"
- When the tag link is rendered
- Then the href is `/tags/C%23`
- And clicking the link navigates to the correct tag detail page

### Requirement: Tag filter sections SHALL be present on all collection list pages

All four collection list pages (posts, projects, docs, notes) SHALL include a tag filter sidebar section with dynamically extracted top tags as clickable links, maintaining visual and functional consistency.

#### Scenario: User visits the docs list page

- Given there are published docs with tags
- When the user views the docs list page
- Then the right sidebar shows top tags as clickable links
- And a "查看全部标签 →" link to /tags is present

### Requirement: Search suggested queries SHALL reflect all collections

The search page suggested queries SHALL be derived from tags across all published content collections (posts, projects, docs, notes), not limited to a single collection.

#### Scenario: A tag exists only in projects

- Given "Docker" is used as a tag in projects but not in posts
- When the search page renders suggested queries
- Then "Docker" may appear as a suggested query if it ranks in the top by frequency
