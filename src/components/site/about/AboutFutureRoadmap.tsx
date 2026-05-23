interface RoadmapItem {
  label: string;
  description: string;
}

interface RoadmapColumn {
  phase: string;
  items: RoadmapItem[];
}

interface AboutFutureRoadmapProps {
  columns: RoadmapColumn[];
  i18nDisclosure: string;
}

export function AboutFutureRoadmap({
  columns,
  i18nDisclosure,
}: AboutFutureRoadmapProps) {
  return (
    <section
      aria-labelledby="about-roadmap-heading"
      className="space-y-[var(--space-stack-lg)]"
    >
      <header className="space-y-3">
        <p className="font-mono text-label tracking-label uppercase text-muted-fg">
          ROADMAP
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h2
          id="about-roadmap-heading"
          className="font-serif text-h2 leading-display tracking-tight text-fg"
        >
          Roadmap
        </h2>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <article key={column.phase} className="launch-panel space-y-4 p-5">
            <p className="font-mono text-label tracking-label uppercase text-muted-fg">
              Phase
            </p>
            <h3 className="font-serif text-h3 leading-display tracking-tight text-fg">
              {column.phase}
            </h3>
            <ul className="space-y-3">
              {column.items.map((item) => (
                <li key={item.label} className="space-y-1">
                  <p className="font-mono text-label tracking-label uppercase text-fg">
                    {item.label}
                  </p>
                  <p className="font-serif text-sm leading-body text-muted-fg">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p className="max-w-[72ch] font-serif text-base leading-body text-muted-fg">
        {i18nDisclosure}
      </p>
    </section>
  );
}
