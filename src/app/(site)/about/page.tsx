import type { Metadata } from "next";

import { AboutContact } from "@/components/site/about/AboutContact";
import { AboutFutureRoadmap } from "@/components/site/about/AboutFutureRoadmap";
import { AboutHero } from "@/components/site/about/AboutHero";
import { AboutImplementationApproach } from "@/components/site/about/AboutImplementationApproach";
import { AboutNow } from "@/components/site/about/AboutNow";
import { AboutPrinciples } from "@/components/site/about/AboutPrinciples";
import { AboutProjectIntent } from "@/components/site/about/AboutProjectIntent";
import { AboutTechStack } from "@/components/site/about/AboutTechStack";
import { aboutContent } from "@/lib/content/about";
import { getAboutPrinciples } from "@/lib/content/principles";

export const metadata: Metadata = {
  title: "About",
  description: aboutContent.hero.lead,
  openGraph: {
    title: "About — TZBlog",
    description: aboutContent.hero.lead,
  },
};

export default async function AboutPage() {
  const aboutPrinciples = getAboutPrinciples().map((principle) => ({
    label: principle.heading,
    detail: principle.detail,
  }));

  return (
    <article className="space-y-[var(--space-section)]">
      <AboutHero {...aboutContent.hero} />
      <AboutNow {...aboutContent.now} />
      <AboutProjectIntent {...aboutContent.projectIntent} />
      <AboutTechStack />
      <AboutImplementationApproach {...aboutContent.implementationApproach} />
      <AboutPrinciples
        intro={aboutContent.principles.intro}
        items={aboutPrinciples}
      />
      <AboutFutureRoadmap {...aboutContent.futureRoadmap} />
      <AboutContact {...aboutContent.contact} />
    </article>
  );
}
