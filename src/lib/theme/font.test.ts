import { describe, expect, it } from "vitest";

import { resolveFontProse } from "./font";

describe("resolveFontProse", () => {
  it("fontProseResolvesToInterInAurora", () => {
    expect(resolveFontProse("aurora")).toContain("--font-inter");
  });

  it("fontProseResolvesToNotoSerifInInk", () => {
    expect(resolveFontProse("ink")).toContain("--font-noto-serif-sc");
  });
});
