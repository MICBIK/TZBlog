import Image from "next/image";

import type { SiteConfigHero } from "@/lib/schemas/siteConfigMetadata";

export interface HomePageHeroProps {
  hero: SiteConfigHero;
}

export function HomePageHero({ hero }: HomePageHeroProps) {
  return (
    <section
      aria-labelledby="home-hero-heading"
      data-testid="home-hero"
      className="space-y-4 border-b border-border pb-12"
    >
      {hero.avatar ? (
        <Image
          src={hero.avatar}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="h-16 w-16 rounded-full border border-border object-cover"
        />
      ) : null}
      <div className="space-y-3">
        <h1
          id="home-hero-heading"
          className="font-serif text-hero leading-display tracking-tight text-fg"
        >
          {hero.tagline}
        </h1>
        <p className="max-w-[55ch] font-serif text-lead leading-body text-muted-fg">
          {hero.subtitle}
        </p>
        {hero.location ? (
          <p className="font-mono text-label tracking-label uppercase text-muted-fg">
            {hero.location}
          </p>
        ) : null}
      </div>
    </section>
  );
}
