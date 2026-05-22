import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const iconPath = join(process.cwd(), "src/app/icon.svg");

describe("icon.svg", () => {
  it("icon.svg exists at src/app/icon.svg", async () => {
    const info = await stat(iconPath);
    expect(info.isFile()).toBe(true);
    expect(info.size).toBeGreaterThan(0);
  });

  it("icon.svg is a well-formed SVG with viewBox", async () => {
    const content = await readFile(iconPath, "utf-8");
    expect(content).toMatch(/^<svg[\s\S]*<\/svg>\s*$/);
    expect(content).toMatch(/viewBox=/);
    expect(content).toMatch(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  });
});
