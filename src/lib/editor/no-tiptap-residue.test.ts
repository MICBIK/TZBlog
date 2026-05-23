import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const FORBIDDEN_TERMS = [
  "@tip" + "tap",
  "tip" + "tap-markdown",
  "low" + "light",
  "prose-" + "neutral",
  "prose-" + "invert",
];

describe("editor dependency residue", () => {
  it("does not leave legacy rich-text editor residue in src or package.json", () => {
    const checkedFiles = [
      path.join(ROOT, "package.json"),
      ...listSourceFiles(path.join(ROOT, "src")),
    ];
    const offenders = checkedFiles.flatMap((file) => {
      const content = readFileSync(file, "utf8");
      return FORBIDDEN_TERMS.filter((term) => content.includes(term)).map(
        (term) => `${path.relative(ROOT, file)} -> ${term}`,
      );
    });

    expect(offenders).toEqual([]);
  });
});

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return listSourceFiles(fullPath);
    if (!/\.(ts|tsx|json)$/.test(entry)) return [];
    if (entry === "no-tiptap-residue.test.ts") return [];
    return [fullPath];
  });
}
