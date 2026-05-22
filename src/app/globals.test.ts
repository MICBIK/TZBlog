import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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

      expect(source, `${file} uses unresolved text var class`).not.toMatch(
        /text-\[var\(--text-/,
      );
      expect(source, `${file} uses unresolved leading var class`).not.toMatch(
        /leading-\[var\(--leading-/,
      );
      expect(source, `${file} uses unresolved tracking var class`).not.toMatch(
        /tracking-\[var\(--tracking-/,
      );
    }
  });
});
