import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const IMG_COMPONENT_FILES = [
  "src/components/reading/ArticleReader.tsx",
  "src/components/site/PostCard.tsx",
  "src/components/admin/media/MediaCard.tsx",
  "src/components/site/GithubCard.tsx",
];

describe("img attrs (SPEC-LH-P-1)", () => {
  it("every <img> in tracked component files has alt + width + height", async () => {
    const violations: string[] = [];

    for (const relPath of IMG_COMPONENT_FILES) {
      const abs = join(process.cwd(), relPath);
      const content = await readFile(abs, "utf-8");
      const imgs = content.match(/<img\b[\s\S]*?\/?>/g) ?? [];

      if (imgs.length === 0) {
        violations.push(`${relPath}: no <img> tag found (file list out of date?)`);
        continue;
      }

      for (const img of imgs) {
        if (!/\bsrc\s*=/.test(img)) continue;

        const hasAlt = /\balt\s*=/.test(img);
        const hasWidth = /\bwidth\s*=/.test(img);
        const hasHeight = /\bheight\s*=/.test(img);
        if (!hasAlt || !hasWidth || !hasHeight) {
          violations.push(
            `${relPath}: <img> missing attr (alt=${hasAlt} width=${hasWidth} height=${hasHeight})\n  ${img.replace(/\s+/g, " ").slice(0, 200)}`,
          );
        }
      }
    }

    expect(violations, violations.join("\n\n")).toEqual([]);
  });
});
