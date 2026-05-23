import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseHslTriplet } from "../lib/visual/contrast";

describe("globals.css editorial system", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf-8");

  it("contains an editorial @theme block", () => {
    expect(css).toContain("@theme {");
  });

  it("defines the Source Serif-backed font-serif token", () => {
    expect(css).toMatch(/--font-serif:\s*var\(--font-source-serif\)/);
  });

  it("defines the hero type scale token", () => {
    expect(css).toMatch(/--text-hero:\s*clamp\(/);
  });

  it("defines the section spacing token", () => {
    expect(css).toMatch(/--space-section:\s*clamp\(/);
  });

  it("defines editorial motion timing", () => {
    expect(css).toContain("--ease-out-expo:");
    expect(css).toContain("--duration-slow:");
  });

  it("disables reveal animation for reduced motion users", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("[data-reveal]");
    expect(css).toContain("animation: none");
    expect(css).toContain("transform: none");
  });

  it("prefers Inter in the sans font chain", () => {
    expect(css).toMatch(/--font-sans:[\s\S]*var\(--font-inter\)/);
  });

  it("defines markdown-body reading styles and callout variants", () => {
    expect(css).toContain(".markdown-body");
    expect(css).toContain(".markdown-body h1");
    expect(css).toContain(".markdown-body a");
    expect(css).toContain(".markdown-body code");
    expect(css).toContain(".markdown-body pre");
    expect(css).toContain(".markdown-body table");
    expect(css).toContain(".markdown-alert");
    expect(css).toContain(".markdown-alert-note");
    expect(css).toContain(".markdown-alert-tip");
    expect(css).toContain(".markdown-alert-important");
    expect(css).toContain(".markdown-alert-warning");
    expect(css).toContain(".markdown-alert-caution");
  });

  it("defines callout accent and tint tokens for light and dark themes", () => {
    const themeBlocks = [
      [":root", cssBlock(css, ":root")],
      [".dark", cssBlock(css, ".dark")],
    ] as const;
    const calloutTypes = ["note", "tip", "important", "warning", "caution"];
    const tokenKinds = ["accent", "tint"];

    for (const [selector, block] of themeBlocks) {
      for (const type of calloutTypes) {
        for (const kind of tokenKinds) {
          const token = `--callout-${type}-${kind}`;

          expect(block, `${selector} defines ${token}`).toMatch(
            new RegExp(`${token}:\\s*[^;]+;`),
          );
        }
      }
    }
  });

  it("callout accent/tint pairs meet WCAG AA contrast", () => {
    const themeBlocks = [
      [":root", cssBlock(css, ":root")],
      [".dark", cssBlock(css, ".dark")],
    ] as const;
    const calloutTypes = ["note", "tip", "important", "warning", "caution"];
    const failures: string[] = [];

    for (const [selector, block] of themeBlocks) {
      for (const type of calloutTypes) {
        const accent = parseHslTriplet(
          cssToken(block, `--callout-${type}-accent`),
        );
        const tint = parseHslTriplet(cssToken(block, `--callout-${type}-tint`));
        const ratio = contrastRatio(accent, tint);

        if (ratio < 4.5) {
          failures.push(`${selector} ${type} ${ratio.toFixed(2)}:1`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it("defines launch-surface primitives with reduced-motion compatibility", () => {
    expect(css).toContain(".launch-surface");
    expect(css).toContain(".launch-panel");
    expect(css).toContain(".launch-grid");
    expect(css).toContain("[data-launch-orbit]");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("[data-launch-orbit]");
    expect(css).toContain("animation: none");
  });

  it("site components use generated theme utilities instead of unresolved var arbitrary classes", () => {
    const files = [
      "src/components/site/HeroEditorial.tsx",
      "src/components/site/TechStack.tsx",
      "src/components/site/GithubCard.tsx",
      "src/components/site/LaunchNarrative.tsx",
      "src/components/site/about/AboutHero.tsx",
      "src/components/site/about/AboutNow.tsx",
      "src/components/site/about/AboutStory.tsx",
      "src/components/site/about/AboutPrinciples.tsx",
      "src/components/site/about/AboutContact.tsx",
      "src/app/(site)/tags/page.tsx",
      "src/app/(site)/tags/[slug]/page.tsx",
    ];

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), "utf-8");

      expect(
        source,
        `${file} uses unresolved text var class`,
      ).not.toContain(unresolvedVarClassToken("text"));
      expect(
        source,
        `${file} uses unresolved leading var class`,
      ).not.toContain(unresolvedVarClassToken("leading"));
      expect(
        source,
        `${file} uses unresolved tracking var class`,
      ).not.toContain(unresolvedVarClassToken("tracking"));
    }
  });
});

function unresolvedVarClassToken(kind: string): string {
  const openBracket = String.fromCharCode(91);
  const openParen = String.fromCharCode(40);
  return `${kind}-${openBracket}var${openParen}--${kind}-`;
}

function cssBlock(css: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`));

  if (!match) {
    throw new Error(`Missing ${selector} block in globals.css`);
  }

  return match[1];
}

function cssToken(block: string, token: string): string {
  const match = block.match(new RegExp(`${token}:\\s*([^;]+);`));

  if (!match) {
    throw new Error(`Missing CSS token ${token}`);
  }

  return match[1].trim();
}
