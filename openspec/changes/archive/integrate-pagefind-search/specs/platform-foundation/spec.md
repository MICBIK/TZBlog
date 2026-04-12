# Spec Delta: platform-foundation

## Change: integrate-pagefind-search

## MODIFIED Requirements

### Requirement: TZBlog search page SHALL provide full-text search across all content types

The search page SHALL use Pagefind to index and search the full text of all published content detail pages (posts, projects, docs, notes). Search results SHALL link directly to the matching detail page. The search index SHALL be generated at build time with zero runtime service dependencies.

#### Scenario: User searches for a keyword in article body

- Given a published post contains the word "PostgreSQL" in its body text
- When the user types "PostgreSQL" in the search input on /search
- Then the search results include that post with a relevant excerpt
- And clicking the result navigates to the post detail page

#### Scenario: Search index is built automatically

- Given the site is built with `pnpm build`
- When the build completes
- Then a `dist/pagefind/` directory exists containing the search index
- And the search page loads and functions correctly in preview mode

#### Scenario: No results found

- Given the user types a query with no matches
- When the search executes
- Then a friendly empty state message is displayed
