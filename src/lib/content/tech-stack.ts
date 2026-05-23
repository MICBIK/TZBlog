export interface TechStackItem {
  name: string;
  rationale: string;
}

export interface TechStackCategory {
  label: string;
  items: TechStackItem[];
}

export const techStackCategories: TechStackCategory[] = [
  {
    label: "Frontend",
    items: [
      { name: "Next.js 16", rationale: "App Router + RSC + Server Actions" },
      { name: "React 19", rationale: "Strict mode, async RSC, modern rendering model" },
      { name: "TypeScript 5", rationale: "Strict types across app, API, and content services" },
      { name: "Tailwind CSS v4", rationale: "CSS-vars driven theming" },
      { name: "shadcn/ui", rationale: "Radix primitives with project-owned styling" },
      { name: "CSS variables", rationale: "Semantic design tokens instead of hard-coded colors" },
      { name: "Responsive typography", rationale: "Editorial scale shared by home, posts, and about" },
    ],
  },
  {
    label: "Content & Editor",
    items: [
      {
        name: "Markdown source editor",
        rationale: "Split source + preview, never WYSIWYG round-trip",
      },
      { name: "remark + rehype", rationale: "Unified markdown AST pipeline" },
      { name: "Shiki", rationale: "Dual-theme syntax highlighting for reading mode" },
      { name: "CodeMirror 6", rationale: "Plain Markdown source editing with selection APIs" },
      { name: "remark-gfm", rationale: "Tables, task lists, and GitHub-flavored syntax" },
      { name: "rehype-sanitize", rationale: "HTML safety boundary before rendering" },
      { name: "Markdown callouts", rationale: "Note, tip, important, warning, and caution blocks" },
    ],
  },
  {
    label: "Backend & Data",
    items: [
      { name: "PostgreSQL 16", rationale: "Primary relational source of truth" },
      { name: "Prisma 7", rationale: "@prisma/adapter-pg driver adapter mode" },
      { name: "Auth.js v5", rationale: "Credentials provider for single-admin CMS access" },
      { name: "Zod", rationale: "Shared client and server validation contracts" },
      { name: "MinIO", rationale: "S3-compatible self-hosted media storage" },
      { name: "Server Actions", rationale: "RSC-native mutations where route handlers are unnecessary" },
      { name: "Post counters", rationale: "Denormalized view, like, and comment counts for reads" },
    ],
  },
  {
    label: "Infra",
    items: [
      { name: "Docker Compose", rationale: "App, Postgres, MinIO, and Caddy as one deploy unit" },
      { name: "Caddy", rationale: "Automatic HTTPS and reverse proxy on the VPS" },
      { name: "Self-hosted VPS", rationale: "Deployment loop stays observable and portable" },
      { name: "PostgreSQL volume", rationale: "Persistent data outside application containers" },
      { name: "MinIO bucket policy", rationale: "Private uploads with explicit public media paths" },
      { name: "Prisma migrate deploy", rationale: "Schema changes are applied during release" },
    ],
  },
  {
    label: "Tooling",
    items: [
      { name: "pnpm", rationale: "Fast installs with deterministic lockfile behavior" },
      { name: "Vitest", rationale: "Unit and integration coverage for services and RSC" },
      { name: "ESLint", rationale: "Static checks before each TDD commit" },
      { name: "Playwright", rationale: "Browser audit and future visual regression coverage" },
      { name: "Husky", rationale: "Commit-time typecheck, lint, and TDD rhythm checks" },
      { name: "SDD artifacts", rationale: "Specs, test map, tasks, and audit evidence stay reviewable" },
    ],
  },
];

export function formatTechStackRationale(item: TechStackItem): string {
  return `${item.name} — ${item.rationale}`;
}
