import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { aboutContent } from "@/lib/content/about";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf-8");
}

function readSourceFiles(dir: string): string {
  const absolute = join(process.cwd(), dir);
  return readdirSync(absolute)
    .flatMap((entry) => {
      const path = join(absolute, entry);
      if (statSync(path).isDirectory()) {
        return readSourceFiles(join(dir, entry));
      }
      if (/\.(test|spec)\./.test(entry)) return [];
      if (!/\.(ts|tsx|md|json)$/.test(entry)) return [];
      return readFileSync(path, "utf-8");
    })
    .join("\n");
}

describe("i18n current-state disclosure", () => {
  it("keeps the About roadmap disclosure explicit about the current single-locale state", () => {
    expect(aboutContent.futureRoadmap.i18nDisclosure).toContain("中文单语言");
    expect(aboutContent.futureRoadmap.i18nDisclosure).toContain("数据模型预留");
    expect(aboutContent.futureRoadmap.i18nDisclosure).toContain("V3");
  });

  it("documents the single-locale status in README", () => {
    const readme = readProjectFile("README.md");

    expect(readme).toContain(
      "Currently a Chinese (zh-CN) single-locale blog. English translation capability is reserved in the schema and tracked for a future V3 SDD.",
    );
  });

  it("documents single-locale sitemap and robots metadata behavior", () => {
    const sitemap = readProjectFile("src/app/sitemap.ts");
    const robots = readProjectFile("src/app/robots.ts");
    const disclosure =
      "Single-locale sitemap. Multi-locale alternates pending V3 (`i18n-locale-routing-v3` SDD).";

    expect(sitemap).toContain(disclosure);
    expect(robots).toContain(disclosure);
  });

  it("does not introduce fake i18n framework or dictionary facades", () => {
    const scannedSource = `${readProjectFile("package.json")}\n${readSourceFiles("src")}`;

    expect(scannedSource).not.toMatch(/next-intl|next-i18next/);
    expect(scannedSource).not.toMatch(/from\s+["'].*dictionary["']/);
    expect(scannedSource).not.toMatch(/alternates:\s*\{[\s\S]*languages/);
  });
});
