# Spec Delta: platform-foundation

## Change: migrate-about-lab-to-cms

## ADDED Requirements

### Requirement: About and Lab pages SHALL source data from Payload CMS

The About page (profile, timeline) and Lab page (experiments) SHALL fetch their data from Payload CMS Globals and Collections respectively. When the CMS API is unavailable, pages SHALL fall back to static data from content.ts without errors.

#### Scenario: CMS has profile data

- Given SiteProfile global is populated in Payload CMS
- When the About page builds
- Then profile name, role, tech stack, and timeline render from CMS data

#### Scenario: CMS is unavailable

- Given Payload CMS is not running
- When the About or Lab page builds
- Then pages render using static fallback data from content.ts
