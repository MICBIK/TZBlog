import { describe, expect, it } from "vitest";

import { resolveFontMono, resolveFontProse } from "./font";

describe("resolveFontProse", () => {
  it("fontProseResolvesToInterInAurora", () => {
    expect(resolveFontProse("aurora")).toContain("--font-inter");
  });

  it("fontProseResolvesToNotoSerifInInk", () => {
    expect(resolveFontProse("ink")).toContain("--font-noto-serif-sc");
  });
});

describe("resolveFontMono", () => {
  it("fontMonoResolvesToJetbrainsInTerminal", () => {
    expect(resolveFontMono("terminal")).toContain("--font-jetbrains-mono");
  });
});
