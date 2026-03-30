# Spec Delta: platform-foundation

## Change: connect-astro-to-payload-api

## MODIFIED Requirements

### Requirement: TZBlog web frontend SHALL expose a full content-first route architecture

The Astro web frontend SHALL provide first-class routes for homepage, post index/detail, project index/detail, docs index/detail, notes index/detail, lab, about, and search. All content routes SHALL source their data from the Payload CMS REST API rather than hardcoded static arrays, so that content updates in the CMS are reflected in the next build without code changes.

#### Scenario: User navigates primary content routes

- Given Payload CMS is running and has published content
- When Astro builds the site
- Then post, project, doc, and note list pages render data fetched from `/api/<collection>?where[_status][equals]=published`
- And detail pages render data fetched by slug from the same API
- And draft content does NOT appear on any frontend page

#### Scenario: API is unavailable at build time

- Given Payload CMS is not running when `astro build` is executed
- When the build runs
- Then the build completes without crashing (empty collections render empty states)
- And a warning is logged for each failed API request

## ADDED Requirements

### Requirement: TZBlog web frontend SHALL use a centralized Payload API client

All Payload CMS data access from the Astro frontend SHALL go through a single `apps/web/src/lib/payload.ts` module. No page or component SHALL directly call `fetch` against the Payload API URL.

#### Scenario: A new content page needs data

- Given a developer adds a new Astro page that needs post data
- When they import from `../../lib/payload`
- Then they get typed functions (getPosts, getPostBySlug, etc.) that handle API URL, error handling, and data transformation
- And they do NOT need to know the Payload API URL or response shape directly

### Requirement: TZBlog web frontend search index SHALL be built dynamically from live CMS data

The search index used by the Signal Search Relay page SHALL be constructed at build time from Payload API data across all four content collections, replacing the static `searchIndex` export in `content.ts`.

#### Scenario: New content is published and site is rebuilt

- Given a new post is published in Payload CMS
- When `astro build` runs
- Then the new post appears in the search index on the `/search` page
- And searching by the post title returns a matching result
