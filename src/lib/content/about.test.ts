import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

interface AboutContent {
  hero: {
    headline: string;
    lead: string;
  };
  now: {
    intro: string;
    items: Array<{
      label: string;
      detail: string;
    }>;
  };
  story: {
    paragraphs: string[];
  };
  principles: {
    intro: string;
    items: Array<{
      label: string;
      detail: string;
    }>;
  };
  contact: {
    email: string;
    links: Array<{
      label: string;
      href: string;
      kind: "github" | "x" | "rss" | "other";
    }>;
  };
}

describe("aboutContent", () => {
  it("aboutContent shape matches type", async () => {
    const { aboutContent } = await loadAboutContent();
    const typedContent: AboutContent = aboutContent;

    expect(typedContent.hero.headline).toEqual(expect.any(String));
    expect(typedContent.hero.lead).toEqual(expect.any(String));
    expect(typedContent.now.items).toEqual(expect.any(Array));
    expect(typedContent.story.paragraphs).toEqual(expect.any(Array));
    expect(typedContent.principles.items).toEqual(expect.any(Array));
    expect(typedContent.contact.links).toEqual(expect.any(Array));
  });

  it("aboutContentHasNoPreLaunchPlaceholders", async () => {
    const fileContent = await readFile(
      join(process.cwd(), "src/lib/content/about.ts"),
      "utf-8",
    );
    const { aboutContent } = await loadAboutContent();

    expect(fileContent).not.toContain("TODO[pre-launch]");
    expect(allContentStrings(aboutContent)).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/Placeholder:/)]),
    );
  });

  it("aboutContent fields non-empty", async () => {
    const { aboutContent } = await loadAboutContent();

    expect(aboutContent.hero.headline.length).toBeGreaterThan(0);
    expect(aboutContent.hero.lead.length).toBeGreaterThan(0);
    expect(aboutContent.now.items.length).toBeGreaterThanOrEqual(2);
    expect(aboutContent.story.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(aboutContent.principles.intro).toContain("TZBlog");
    expect(aboutContent.principles.items.length).toBeGreaterThanOrEqual(3);
    expect(allContentStrings(aboutContent)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Markdown/),
        expect.stringMatching(/self-hosted|Self-hosted/),
        expect.stringMatching(/Next\.js|PostgreSQL|MinIO/),
      ]),
    );
    expect(aboutContent.contact.email).toMatch(/.+@.+\..+/);
    expect(aboutContent.contact.links.length).toBeGreaterThanOrEqual(1);
  });

  it("about content data has reading column", async () => {
    const { aboutContent } = await loadAboutContent();

    expect(aboutContent.now.items.map((item) => item.label)).toEqual([
      "Shipping",
      "Writing",
      "Reading",
      "Hardening",
    ]);
    expect(aboutContent.now.items.find((item) => item.label === "Reading")?.detail).toContain(
      "Designing Data-Intensive Apps",
    );
  });

  it("content is source of truth for about narrative sections", async () => {
    const { aboutContent } = (await loadAboutContent()) as unknown as {
      aboutContent: {
        projectIntent?: {
          sections: Array<{ heading: string; body: string }>;
        };
        implementationApproach?: {
          entries: Array<{ heading: string; body: string; code?: string }>;
        };
        futureRoadmap?: {
          columns: Array<{
            phase: string;
            items: Array<{ label: string; description: string }>;
          }>;
          i18nDisclosure: string;
        };
      };
    };
    const fileContent = await readFile(
      join(process.cwd(), "src/lib/content/about.ts"),
      "utf-8",
    );

    expect(aboutContent.projectIntent?.sections).toHaveLength(3);
    expect(aboutContent.implementationApproach?.entries).toHaveLength(4);
    expect(aboutContent.futureRoadmap?.columns.map((column) => column.phase)).toEqual([
      "Current",
      "V2",
      "V3",
    ]);
    expect(aboutContent.futureRoadmap?.i18nDisclosure).toContain("中文单语言");
    expect(fileContent).toContain("export interface AboutProjectIntentSection");
    expect(fileContent).toContain("export interface ImplementationApproachEntry");
    expect(fileContent).toContain("export interface RoadmapColumn");
  });
});

const aboutModulePath = "./about";

async function loadAboutContent() {
  return (await vi.importActual(aboutModulePath)) as {
    aboutContent: AboutContent;
  };
}

function allContentStrings(content: AboutContent): string[] {
  return [
    content.hero.headline,
    content.hero.lead,
    content.now.intro,
    content.principles.intro,
    content.contact.email,
    ...content.now.items.flatMap((item) => [item.label, item.detail]),
    ...content.story.paragraphs,
    ...content.principles.items.flatMap((item) => [item.label, item.detail]),
    ...content.contact.links.flatMap((link) => [link.label, link.href]),
  ];
}
