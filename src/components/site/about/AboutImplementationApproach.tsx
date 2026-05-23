interface ImplementationEntry {
  label: string;
  heading: string;
  body: string;
  code?: string;
}

interface AboutImplementationApproachProps {
  entries: ImplementationEntry[];
}

export function AboutImplementationApproach({
  entries,
}: AboutImplementationApproachProps) {
  return (
    <section
      aria-labelledby="about-implementation-heading"
      className="space-y-[var(--space-stack-lg)]"
    >
      <header className="space-y-3">
        <p className="font-mono text-label tracking-label uppercase text-muted-fg">
          IMPLEMENTATION
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h2
          id="about-implementation-heading"
          className="font-serif text-h2 leading-display tracking-tight text-fg"
        >
          Implementation approach
        </h2>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {entries.map((entry) => (
          <article key={entry.heading} className="launch-panel space-y-4 p-5">
            <p className="font-mono text-label tracking-label uppercase text-muted-fg">
              {entry.label}
            </p>
            <h3 className="font-serif text-h3 leading-display tracking-tight text-fg">
              {entry.heading}
            </h3>
            <p className="font-serif text-base leading-body text-muted-fg">
              {entry.body}
            </p>
            {entry.code ? (
              <pre className="shiki overflow-x-auto rounded-lg border border-border bg-code-bg p-4 text-sm leading-body text-code-fg">
                <code>{entry.code}</code>
              </pre>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
