import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { milkdownParse, milkdownSerialize } from "./milkdownBridge";

const FIXTURE_DIR = join(process.cwd(), "src/components/editor/__fixtures__/round-trip");

function loadFixture(name: string): string {
  return readFileSync(join(FIXTURE_DIR, `${name}.md`), "utf8");
}

describe("Milkdown Markdown round-trip parity", () => {
  it("preservesBasicMdVerbatim", async () => {
    const source = loadFixture("basic");
    const parsed = await milkdownParse(source);
    const exported = await milkdownSerialize(parsed);

    expect(exported.trim()).toBe(source.trim());
  });

  it("preservesListMdVerbatim", async () => {
    const source = loadFixture("list");
    const parsed = await milkdownParse(source);
    const exported = await milkdownSerialize(parsed);

    expect(exported.trim()).toBe(source.trim());
  });
});
