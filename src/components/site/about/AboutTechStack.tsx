import { techStackCategories } from "@/lib/content/tech-stack";

export function AboutTechStack() {
  return (
    <section
      id="tech-stack"
      aria-labelledby="about-tech-stack-heading"
      className="space-y-[var(--space-stack-lg)] scroll-mt-24"
    >
      <header className="space-y-3">
        <p className="font-mono text-label tracking-label uppercase text-muted-fg">
          TECH STACK
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h2
          id="about-tech-stack-heading"
          className="font-serif text-h2 leading-display tracking-tight text-fg"
        >
          Technology choices
        </h2>
      </header>

      <div className="space-y-[var(--space-stack-lg)]">
        {techStackCategories.map((category) => (
          <section
            key={category.label}
            aria-labelledby={`about-tech-stack-${slugify(category.label)}`}
            className="launch-panel space-y-5 p-5 sm:p-6"
          >
            <header className="space-y-2">
              <p className="font-mono text-label tracking-label uppercase text-muted-fg">
                {String(category.items.length).padStart(2, "0")} decisions
              </p>
              <h3
                id={`about-tech-stack-${slugify(category.label)}`}
                className="font-serif text-h3 leading-display tracking-tight text-fg"
              >
                {category.label}
              </h3>
            </header>

            <dl className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
              {category.items.map((item) => (
                <div
                  key={item.name}
                  className="grid gap-1 border-t border-border pt-4 sm:col-span-2 sm:grid-cols-subgrid"
                >
                  <dt className="font-mono text-label tracking-label uppercase text-muted-fg">
                    {item.name}
                  </dt>
                  <dd className="font-serif text-base leading-body text-fg">
                    {item.rationale}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </section>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
