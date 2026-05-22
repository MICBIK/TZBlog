interface AboutHeroProps {
  headline: string;
  lead: string;
}

export function AboutHero({ headline, lead }: AboutHeroProps) {
  return (
    <section aria-labelledby="about-hero-heading" className="space-y-6">
      <header className="space-y-3">
        <p className="font-mono text-label tracking-label uppercase text-muted-fg">
          ABOUT
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
      </header>
      <h1
        id="about-hero-heading"
        className="font-serif text-h1 leading-display tracking-tight text-fg"
      >
        {headline}
      </h1>
      <p className="max-w-[65ch] font-serif text-lead leading-body text-muted-fg">
        {lead}
      </p>
    </section>
  );
}
