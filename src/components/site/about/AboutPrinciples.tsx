interface PrincipleItem {
  label: string;
  detail: string;
}

interface AboutPrinciplesProps {
  intro: string;
  items: PrincipleItem[];
}

export function AboutPrinciples({ intro, items }: AboutPrinciplesProps) {
  return (
    <section
      aria-labelledby="about-principles-heading"
      className="launch-surface space-y-8 rounded-[2rem] px-5 py-8 sm:px-8"
    >
      <header className="space-y-3">
        <p className="font-mono text-label tracking-label uppercase text-muted-fg">
          PRINCIPLES
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h2
          id="about-principles-heading"
          className="font-serif text-h2 leading-display tracking-tight text-fg"
        >
          Principles
        </h2>
      </header>

      <p className="max-w-[65ch] font-serif text-base leading-body text-fg">
        {intro}
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.label} className="launch-panel space-y-3 p-5">
            <h3 className="font-mono text-label tracking-label uppercase text-muted-fg">
              {item.label}
            </h3>
            <p className="font-serif text-base leading-body text-fg">
              {item.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
