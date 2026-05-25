import type { SiteConfigHero } from "@/lib/schemas/siteConfigMetadata";

export function HomePageHero({ hero }: { hero: SiteConfigHero }) {
  return (
    <section aria-labelledby="home-hero-heading" data-testid="home-hero" className="space-y-4 border-b border-border pb-12">
      <div className="space-y-3">
        <h1 id="home-hero-heading" className="font-serif text-hero leading-display tracking-tight text-fg">{hero.tagline}</h1>
        <p className="max-w-[55ch] font-serif text-lead leading-body text-muted-fg">{hero.subtitle}</p>
      </div>
    </section>
  );
}
