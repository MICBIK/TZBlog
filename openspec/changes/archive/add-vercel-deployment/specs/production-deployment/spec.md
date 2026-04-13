## ADDED Requirements

### Requirement: TZBlog SHALL be deployable to Vercel via Git integration

Both `apps/web` (Astro) and `apps/cms` (Payload/Next.js) SHALL have Vercel deployment configurations that enable zero-config deployment via Vercel's Git integration.

#### Scenario: Push to main triggers deployment

- **WHEN** code is pushed to the `main` branch
- **THEN** Vercel automatically builds and deploys both Web and CMS projects

### Requirement: CMS content publish SHALL trigger Web rebuild

When content is published in Payload CMS, a Vercel Deploy Hook SHALL be triggered to rebuild the Astro static site with fresh content.

#### Scenario: New content is published

- **WHEN** an editor publishes or updates content in CMS
- **AND** `VERCEL_DEPLOY_HOOK_URL` is configured
- **THEN** the Web project is automatically rebuilt with the new content
