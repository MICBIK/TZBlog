# Spec Delta: platform-foundation

## Change: add-seo-meta-tags

## ADDED Requirements

### Requirement: All pages SHALL include OG image and favicon meta tags

Every page SHALL include `og:image` and `twitter:image` meta tags pointing to a default site-level image, with per-page override support via the `ogImage` prop. The site SHALL include a favicon via a `<link>` tag in the document head.

#### Scenario: Page shared on social media

- Given any page URL is shared on Twitter/Discord/WeChat
- When the platform fetches OG tags
- Then og:image and twitter:image return a valid image URL
