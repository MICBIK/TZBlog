import type { CSSProperties } from "react";

interface AboutHeroProps {
  headline: string;
  lead: string;
}

function revealStyle(delay: string): CSSProperties {
  return { "--reveal-delay": delay } as CSSProperties;
}

export function AboutHero({ headline, lead }: AboutHeroProps) {
  return (
    <section
      data-about-hero-surface
      aria-labelledby="about-hero-heading"
      className="about-hero-surface launch-surface relative isolate overflow-hidden rounded-[2rem] px-5 py-8 sm:px-8 lg:px-10"
    >
      <div
        data-hero-dot-grid
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-100"
      />
      <div
        data-hero-grain
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-100"
      />

      <div className="relative space-y-6">
        <header className="space-y-4">
          <p
            data-reveal
            style={revealStyle("0ms")}
            className="font-mono text-label tracking-label uppercase text-muted-fg"
          >
            ABOUT · ha1den
          </p>
          <h1
            id="about-hero-heading"
            data-reveal
            style={revealStyle("100ms")}
            className="font-serif text-h1 leading-display tracking-tight text-fg"
          >
            {headline}
          </h1>
          <div
            data-reveal
            style={revealStyle("200ms")}
            className="hero-divider h-px w-12 border-t border-border"
            aria-hidden="true"
          />
          <p
            data-reveal
            style={revealStyle("200ms")}
            className="max-w-[65ch] font-serif text-lead leading-body text-muted-fg"
          >
            {lead}
          </p>
        </header>

        <p
          data-reveal
          style={revealStyle("300ms")}
          className="font-mono text-label tracking-label uppercase text-muted-fg"
        >
          Now: shipping TZBlog and documenting the tradeoffs
        </p>
      </div>
    </section>
  );
}
