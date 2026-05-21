import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("RootLayout font setup", () => {
  const source = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf-8");

  it("loads Source Serif 4 and Inter from next/font/google", () => {
    expect(source).toContain("Source_Serif_4");
    expect(source).toContain("Inter");
    expect(source).toContain('variable: "--font-source-serif"');
    expect(source).toContain('variable: "--font-inter"');
    expect(source).toContain('display: "swap"');
  });

  it("mounts editorial font variables with existing Geist variables", () => {
    expect(source).toContain("sourceSerif.variable");
    expect(source).toContain("inter.variable");
    expect(source).toContain("geistSans.variable");
    expect(source).toContain("geistMono.variable");
  });
});
