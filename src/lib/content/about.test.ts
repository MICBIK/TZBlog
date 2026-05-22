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
    expect(aboutContent.contact.email).toMatch(/.+@.+\..+/);
    expect(aboutContent.contact.links.length).toBeGreaterThanOrEqual(1);
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
    content.contact.email,
    ...content.now.items.flatMap((item) => [item.label, item.detail]),
    ...content.story.paragraphs,
    ...content.contact.links.flatMap((link) => [link.label, link.href]),
  ];
}
