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
});
