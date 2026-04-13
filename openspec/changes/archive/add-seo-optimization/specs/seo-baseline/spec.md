## ADDED Requirements

### Requirement: TZBlog SHALL generate a sitemap for search engine discovery

The Astro build SHALL produce a `sitemap-index.xml` at the site root, listing all public pages for search engine crawlers.

#### Scenario: Build produces sitemap

- **WHEN** `astro build` completes
- **THEN** `dist/sitemap-index.xml` exists and contains URLs for all public pages

### Requirement: TZBlog SHALL serve a robots.txt

A `robots.txt` file SHALL be served at the site root, allowing all crawlers and pointing to the sitemap location.

#### Scenario: Crawler requests robots.txt

- **WHEN** a search engine requests `/robots.txt`
- **THEN** it receives a valid robots.txt with `Sitemap:` directive

### Requirement: All pages SHALL include Open Graph and Twitter Card meta tags

Every page SHALL include `og:title`, `og:description`, `og:url`, `og:type` and `twitter:card`, `twitter:title`, `twitter:description` meta tags for social sharing previews.

#### Scenario: Page is shared on social media

- **WHEN** a page URL is shared on Twitter/LinkedIn/Slack
- **THEN** the platform renders a rich preview card with title, description, and optional image

### Requirement: TZBlog SHALL provide an RSS feed

An RSS 2.0 feed SHALL be available at `/rss.xml` containing the latest published posts.

#### Scenario: User subscribes to RSS

- **WHEN** a reader requests `/rss.xml`
- **THEN** they receive a valid RSS 2.0 XML document with the 20 most recent published posts
