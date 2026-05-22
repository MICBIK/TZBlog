# content specs

## SCENARIO: prelaunch-content-001

**GIVEN** the About page is part of the public launch surface
**WHEN** `aboutContent` is loaded
**THEN** no field contains `Placeholder:` or `TODO[pre-launch]`, and the exported content remains non-empty.

## SCENARIO: prelaunch-content-002

**GIVEN** the homepage TechStack is part of the public launch surface
**WHEN** `<TechStack />` renders
**THEN** it shows the actual stack: Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui, Markdown source editor, remark + rehype, Shiki, PostgreSQL 16, Prisma 7, Auth.js v5, Zod, MinIO, Docker Compose, Caddy, self-hosted VPS, pnpm, Vitest, ESLint, and Playwright.

