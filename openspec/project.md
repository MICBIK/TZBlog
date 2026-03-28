# TZBlog OpenSpec Project Context

## Product Baseline

- Project name: `TZBlog`
- Direction: full-stack cosmic-themed content blog
- Product expression: `deep space observatory + main planet hero`
- Primary goal: long-term content publishing, not single-page portfolio showcase

## Locked Stack

- Web: `Astro`
- CMS: `Payload CMS`
- Database: `PostgreSQL`
- Search: `Pagefind`
- Analytics: `Umami`
- Media: `S3 / R2` compatible storage

## Locked Content Model

- `posts`
- `projects`
- `docs`
- `notes`
- `pages`

## Delivery Priorities

1. `infra`
2. `cms`
3. `web`
4. search / analytics / SEO
5. hero 3D / visual enhancement

## Non-Goals

- Reverting to a static-only blog architecture
- Building a custom CMS
- Building a custom analytics backend
- Prioritizing heavy visual effects before the content pipeline works

## OpenSpec Rules

- Every non-trivial change MUST have an OpenSpec change record
- Change names MUST use kebab-case
- One change SHOULD target one main goal
- Proposal / specs / tasks come before implementation
- Design is required for cross-cutting or architecture-affecting work
- Tasks MUST stay in sync with implementation progress
- Completed changes MUST be archived

## Current Baseline Capabilities

- `platform-foundation`
  Main product and architecture baseline
- `change-governance`
  Repository-level change tracking workflow

## Handoff Rule

Before starting a new implementation session:

1. Run `npx -y @fission-ai/openspec@1.2.0 list`
2. Read `openspec/specs/`
3. Continue an existing related change or create a new one
