# Showcase Content

### SCENARIO: showcase-seed-001

**GIVEN** a fresh database with an admin user
**WHEN** `pnpm db:seed` runs
**THEN** it creates a deterministic showcase dataset with published posts, columns, tags, cover URLs, rich Markdown body content, and approved comments without duplicating rows on repeated runs.

### SCENARIO: showcase-seed-002

**GIVEN** the showcase dataset has been seeded
**WHEN** public routes query published content
**THEN** the homepage, `/posts`, `/columns`, `/tags`, and a post detail route all have enough content to exercise the final visual design instead of only empty states.

<!-- Draft auto-generated from explore. Review before use. Generated: 2026-05-24T00:00:00+08:00 -->
