import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

async function walk(dir: string, files: string[] = []): Promise<string[]> {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const abs = join(dir, entry);
    const info = await stat(abs);
    if (info.isDirectory()) {
      await walk(abs, files);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      files.push(abs);
    }
  }
  return files;
}

describe("Tiptap isolation (SPEC-LH-P-2)", () => {
  it("@tiptap is not imported from any (site) route or src/components/site/*", async () => {
    const violations: string[] = [];
    const targets = [
      join(process.cwd(), "src/app/(site)"),
      join(process.cwd(), "src/components/site"),
    ];

    for (const root of targets) {
      const files = await walk(root);
      for (const file of files) {
        if (/\.test\.(tsx?|jsx?)$/.test(file)) continue;
        const content = await readFile(file, "utf-8");
        if (/from\s+["']@tiptap/.test(content)) {
          violations.push(file.replace(`${process.cwd()}/`, ""));
        }
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
