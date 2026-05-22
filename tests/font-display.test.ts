import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("next/font display=swap (SPEC-LH-P-3)", () => {
  it("every next/font/google font in src/app/layout.tsx has display: 'swap'", async () => {
    const content = await readFile(
      join(process.cwd(), "src/app/layout.tsx"),
      "utf-8",
    );

    const fontDecls = content.match(/\b(Geist|Geist_Mono|Inter|Source_Serif_4)\s*\(\s*\{[\s\S]*?\}\s*\)/g) ?? [];
    expect(fontDecls.length).toBeGreaterThan(0);

    const missing: string[] = [];
    for (const decl of fontDecls) {
      const name = decl.match(/^(\w+)/)?.[1] ?? "<unknown>";
      if (!/display:\s*["']swap["']/.test(decl)) {
        missing.push(name);
      }
    }

    expect(missing, missing.join(", ")).toEqual([]);
  });
});
