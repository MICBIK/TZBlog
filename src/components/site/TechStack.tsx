interface TechItem {
  name: string;
  note?: string;
}

interface TechCategory {
  label: string;
  items: TechItem[];
}

const techStack: TechCategory[] = [
  {
    label: "Frontend",
    items: [
      { name: "Next.js 15", note: "App Router + RSC + Server Actions" },
      { name: "React 19", note: "with strict mode" },
      { name: "TypeScript 5", note: "strict everywhere" },
      { name: "Tailwind CSS v4", note: "CSS-vars driven theming" },
      { name: "shadcn/ui", note: "primitives + Radix under the hood" },
    ],
  },
  {
    label: "Content & Editor",
    items: [
      { name: "Tiptap v2", note: "WYSIWYG ↔ Markdown" },
      { name: "remark + rehype", note: "server-side MD pipeline" },
      { name: "Shiki", note: "syntax highlighting" },
    ],
  },
  {
    label: "Backend & Data",
    items: [
      { name: "PostgreSQL 16", note: "single source of truth" },
      { name: "Prisma 7", note: "with @prisma/adapter-pg driver" },
      { name: "Auth.js v5", note: "Credentials provider, Edge-safe" },
      { name: "Zod", note: "shared client/server schemas" },
      { name: "MinIO", note: "S3-compatible media storage" },
    ],
  },
  {
    label: "Infra",
    items: [
      { name: "Docker Compose", note: "app + Postgres + MinIO + Caddy" },
      { name: "Caddy", note: "automatic HTTPS + reverse proxy" },
      { name: "Self-hosted VPS", note: "no platform lock-in" },
    ],
  },
  {
    label: "Tooling",
    items: [
      { name: "pnpm", note: "fast, disk-efficient" },
      { name: "Vitest", note: "unit + integration" },
      { name: "ESLint", note: "+ TypeScript-aware rules" },
      { name: "Playwright", note: "planned for E2E + visual regression" },
    ],
  },
];

export function TechStack() {
  return (
    <section
      aria-labelledby="tech-stack-heading"
      className="space-y-[var(--space-stack-lg)]"
    >
      <header className="space-y-2">
        <p className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg">
          What powers this
        </p>
        <h2
          id="tech-stack-heading"
          className="font-serif text-[var(--text-h2)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg"
        >
          Tech Stack
        </h2>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
      </header>

      <div className="space-y-[var(--space-stack-lg)]">
        {techStack.map((category, index) => {
          const headingId = `ts-${category.label
            .toLowerCase()
            .replace(/[^a-z]+/g, "-")
            .replace(/^-|-$/g, "")}`;

          return (
            <section
              key={category.label}
              aria-labelledby={headingId}
              className="space-y-4"
            >
              <h3
                id={headingId}
                className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg"
              >
                {category.label.toUpperCase()}
              </h3>

              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <p className="font-serif text-[var(--text-base)] text-fg">
                      {item.name}
                    </p>
                    {item.note ? (
                      <p className="text-sm leading-[var(--leading-body)] text-muted-fg">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              {index < techStack.length - 1 ? (
                <div
                  className="h-px w-full border-t border-border pt-4"
                  aria-hidden="true"
                />
              ) : null}
            </section>
          );
        })}
      </div>
    </section>
  );
}
