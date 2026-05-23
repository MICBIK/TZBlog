import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HomeGarden } from "./HomeGarden";
import { InteractiveExplainer } from "./InteractiveExplainer";

describe("site reduced motion system", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf-8");

  it("disablesLargeMotionWhenReducedMotionIsPreferred", () => {
    const { container } = render(
      <>
        <HomeGarden
          hero={<section>Hero ready</section>}
          featuredAndRecent={<section>Posts ready</section>}
          columns={<section>Projects ready</section>}
          principles={<section>Principles ready</section>}
          techStack={<section>Tech ready</section>}
          github={<section>GitHub ready</section>}
          stats={<section>Stats ready</section>}
        />
        <InteractiveExplainer
          title="Reduced motion demo"
          description="Motion must degrade without hiding content."
          fallback={{
            title: "Static fallback",
            detail: "Static content remains visible.",
          }}
          steps={[
            { title: "Read", detail: "Content is visible immediately." },
            { title: "Scan", detail: "No large movement is required." },
          ]}
        />
      </>,
    );

    expect(container.querySelector("[data-home-garden]")).toHaveAttribute(
      "data-reduced-motion-safe",
    );
    expect(
      screen.getByRole("region", { name: "Reduced motion demo" }),
    ).toHaveAttribute("data-reduced-motion-safe");

    const reducedBlocks = reducedMotionBlocks(css).join("\n");
    expect(reducedBlocks).toContain("[data-reduced-motion-safe] *");
    expect(reducedBlocks).toContain("animation-duration: 0.01ms");
    expect(reducedBlocks).toContain("transition-duration: 0.01ms");
    expect(reducedBlocks).toContain("--reveal-delay: 0ms");
    expect(reducedBlocks).toMatch(
      /\[data-reduced-motion-safe\]\s+\.launch-panel,\s*\[data-reduced-motion-safe\]\s+\.launch-panel:hover\s*\{[\s\S]*transform:\s*none/,
    );
    expect(reducedBlocks).toMatch(
      /\[data-reduced-motion-safe\]\s+\[data-launch-orbit\]\s*\{[\s\S]*animation:\s*none/,
    );
    expect(reducedBlocks).toMatch(
      /\[data-reduced-motion-safe\]\s+\[data-reveal\]\s*\{[\s\S]*opacity:\s*1[\s\S]*transform:\s*none/,
    );
  });
});

function reducedMotionBlocks(css: string): string[] {
  const marker = "@media (prefers-reduced-motion: reduce)";
  const blocks: string[] = [];
  let offset = 0;

  while (offset < css.length) {
    const markerIndex = css.indexOf(marker, offset);
    if (markerIndex < 0) break;

    const openBrace = css.indexOf("{", markerIndex);
    if (openBrace < 0) break;

    let depth = 0;
    for (let index = openBrace; index < css.length; index += 1) {
      const char = css[index];

      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;

      if (depth === 0) {
        blocks.push(css.slice(openBrace + 1, index));
        offset = index + 1;
        break;
      }
    }
  }

  return blocks;
}
