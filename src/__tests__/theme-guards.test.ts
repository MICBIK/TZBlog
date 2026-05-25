import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkTsFiles(full, acc);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

describe("theme guards", () => {
  it("noChannelThemeFieldInPrismaSchema", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).not.toMatch(/^\s*theme\s+/m);
  });

  it("noThemeSwitcherComponentInSrc", () => {
    const files = walkTsFiles(join(process.cwd(), "src"));
    const hits = files.filter((file) => {
      const content = readFileSync(file, "utf8");
      return /切换主题|theme switcher|ThemeSwitcher/i.test(content);
    });
    expect(hits).toEqual([]);
  });
});
