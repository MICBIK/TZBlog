interface AboutNowItem {
  label: string;
  detail: string;
}

interface AboutNowProps {
  intro: string;
  items: AboutNowItem[];
}

export function AboutNow({ intro, items }: AboutNowProps) {
  return (
    <section aria-labelledby="about-now-heading" className="space-y-6">
      <header className="space-y-3">
        <p className="font-mono text-label tracking-label uppercase text-muted-fg">
          NOW
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h2
          id="about-now-heading"
          className="font-serif text-h2 leading-display tracking-tight text-fg"
        >
          Now
        </h2>
      </header>

      <p className="max-w-[65ch] font-serif text-base leading-body text-fg">
        {intro}
      </p>

      <dl className="grid gap-6 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        {items.map((item, index) => (
          <div key={item.label} className="grid gap-1 sm:grid-cols-subgrid sm:col-span-2">
            <dt className="font-mono text-label tracking-label uppercase text-muted-fg">
              Focus {String(index + 1).padStart(2, "0")}
            </dt>
            <dd className="space-y-2">
              <h3 className="font-serif text-h3 leading-display tracking-tight text-fg">
                {item.label}
              </h3>
              <p className="font-serif text-base leading-body text-muted-fg">
                {item.detail}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
