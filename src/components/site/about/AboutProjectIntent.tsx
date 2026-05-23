interface AboutProjectIntentSection {
  heading: string;
  body: string;
}

interface AboutProjectIntentProps {
  sections: AboutProjectIntentSection[];
}

export function AboutProjectIntent({ sections }: AboutProjectIntentProps) {
  return (
    <section
      aria-labelledby="about-project-intent-heading"
      className="space-y-[var(--space-stack-lg)]"
    >
      <header className="space-y-3">
        <p className="font-mono text-label tracking-label uppercase text-muted-fg">
          PROJECT INTENT
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h2
          id="about-project-intent-heading"
          className="font-serif text-h2 leading-display tracking-tight text-fg"
        >
          Why this site exists
        </h2>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <article key={section.heading} className="launch-panel space-y-3 p-5">
            <h3 className="font-serif text-h3 leading-display tracking-tight text-fg">
              {section.heading}
            </h3>
            <p className="max-w-[65ch] font-serif text-base leading-body text-muted-fg">
              {section.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
