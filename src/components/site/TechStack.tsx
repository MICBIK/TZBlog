import Link from "next/link";

import {
  formatTechStackRationale,
  techStackCategories,
} from "@/lib/content/tech-stack";

export function TechStack() {
  return (
    <section
      aria-labelledby="tech-stack-heading"
      className="space-y-[var(--space-stack-lg)]"
    >
      <header className="space-y-2">
        <p className="font-mono text-label tracking-label uppercase text-muted-fg">
          5 areas, 30+ pieces, all self-hosted.
        </p>
        <h2
          id="tech-stack-heading"
          className="font-serif text-h2 leading-display tracking-tight text-fg"
        >
          技术体系
        </h2>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
      </header>

      <div className="space-y-[var(--space-stack-lg)]">
        {techStackCategories.map((category, index) => {
          const headingId = `ts-${category.category
            .toLowerCase()
            .replace(/[^a-z]+/g, "-")
            .replace(/^-|-$/g, "")}`;

          return (
            <section
              key={category.category}
              aria-labelledby={headingId}
              className="space-y-4"
            >
              <h3
                id={headingId}
                className="font-mono text-label tracking-label uppercase text-muted-fg"
              >
                {category.category.toUpperCase()}
              </h3>

              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <abbr
                      data-testid="tech-stack-item-name"
                      title={formatTechStackRationale(item)}
                      className="block cursor-help no-underline"
                    >
                      <span className="font-serif text-base text-fg">
                      {item.name}
                      </span>
                    </abbr>
                    {item.rationale ? (
                      <p className="text-sm leading-body text-muted-fg">
                        {item.rationale}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              {index < techStackCategories.length - 1 ? (
                <div
                  className="h-px w-full border-t border-border pt-4"
                  aria-hidden="true"
                />
              ) : null}
            </section>
          );
        })}
      </div>

      <Link
        href="/about#tech-stack"
        className="inline-flex text-sm text-muted-fg transition-colors hover:text-fg"
      >
        完整技术选型理由 →
      </Link>
    </section>
  );
}
