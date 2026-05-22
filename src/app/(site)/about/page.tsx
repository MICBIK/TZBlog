import type { Metadata } from "next";

import { AboutContact } from "@/components/site/about/AboutContact";
import { AboutHero } from "@/components/site/about/AboutHero";
import { AboutNow } from "@/components/site/about/AboutNow";
import { AboutPrinciples } from "@/components/site/about/AboutPrinciples";
import { AboutStory } from "@/components/site/about/AboutStory";
import { aboutContent } from "@/lib/content/about";

export const metadata: Metadata = {
  title: "About",
  description: aboutContent.hero.lead,
  openGraph: {
    title: "About — TZBlog",
    description: aboutContent.hero.lead,
  },
};

export default async function AboutPage() {
  return (
    <article className="space-y-[var(--space-section)]">
      <AboutHero {...aboutContent.hero} />
      <AboutNow {...aboutContent.now} />
      <AboutStory {...aboutContent.story} />
      <AboutPrinciples {...aboutContent.principles} />
      <AboutContact {...aboutContent.contact} />
    </article>
  );
}
