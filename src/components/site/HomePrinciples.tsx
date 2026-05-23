import type { CSSProperties } from "react";

import { getHomePrinciples } from "@/lib/content/principles";

function revealStyle(index: number): CSSProperties {
  return { "--reveal-delay": `${index * 80}ms` } as CSSProperties;
}

export function HomePrinciples() {
  const featured = getHomePrinciples();

  return (
    <section
      aria-labelledby="home-principles-heading"
      className="space-y-[var(--space-stack-lg)]"
    >
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="font-mono text-label tracking-label uppercase text-muted-fg">
            Engineering principles
          </p>
          <h2
            id="home-principles-heading"
            className="font-serif text-h2 leading-display tracking-tight text-fg"
          >
            原则
          </h2>
        </div>
        <div className="hidden h-px flex-1 border-t border-border sm:block" />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((principle, index) => (
          <article
            key={principle.id}
            data-reveal
            style={revealStyle(index)}
            className="launch-panel space-y-4 p-5"
          >
            <p className="font-mono text-label tracking-label text-muted-fg">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="font-serif text-lead leading-display tracking-tight text-fg">
              {principle.heading}
            </h3>
            <p className="font-serif text-sm leading-body text-muted-fg">
              {principle.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HomePrinciples;
