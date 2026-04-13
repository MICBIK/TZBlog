## MODIFIED Requirements

### Requirement: Site identity information SHALL be managed through CMS globals

The site metadata (title, description, location), about profile, social links, and pinned repos SHALL be read from the Payload CMS `SiteProfile` global at build time, with static fallback values when CMS is unavailable.

#### Scenario: CMS provides site identity

- **WHEN** the Astro build fetches site settings from CMS
- **AND** the CMS returns valid data
- **THEN** the site uses CMS-provided values for title, description, social links, and profile

#### Scenario: CMS is unavailable

- **WHEN** the Astro build cannot reach the CMS
- **THEN** the site falls back to hardcoded values in `content.ts` and renders normally
