import { describe, expect, it, vi } from "vitest";

const modulePath = "./principles";

describe("principles content", () => {
  it("defines 8 about principles with 4 featured home principles", async () => {
    const { principles } = await loadPrinciples();
    const featured = principles.filter((principle) => principle.isFeatured);

    expect(principles).toHaveLength(8);
    expect(featured).toHaveLength(4);
    expect(featured.map((principle) => principle.heading)).toEqual([
      "Source-first publishing",
      "Markdown is the source",
      "Document tradeoffs",
      "Self-host the whole loop",
    ]);
  });

  it("HomePrinciples is a featured subset of AboutPrinciples, not the full set", async () => {
    const { getAboutPrinciples, getHomePrinciples } = await loadPrinciples();
    const about = getAboutPrinciples();
    const home = getHomePrinciples();

    expect(home.every((item) => about.some((full) => full.id === item.id))).toBe(
      true,
    );
    expect(home.length).toBeLessThan(about.length);
  });
});

async function loadPrinciples() {
  return (await vi.importActual(modulePath)) as {
    principles: Array<{
      id: string;
      heading: string;
      detail: string;
      isFeatured: boolean;
    }>;
    getAboutPrinciples: () => Array<{
      id: string;
      heading: string;
      detail: string;
      isFeatured: boolean;
    }>;
    getHomePrinciples: () => Array<{
      id: string;
      heading: string;
      detail: string;
      isFeatured: boolean;
    }>;
  };
}
