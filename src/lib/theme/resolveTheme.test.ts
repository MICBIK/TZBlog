import { describe, expect, it } from "vitest";

import { resolveChannelTheme, resolveEntryTheme } from "./resolveTheme";

describe("resolveChannelTheme", () => {
  it("channelStreamKindResolvesToTerminal", () => {
    expect(resolveChannelTheme({ kind: "STREAM", layout: "FEED" })).toBe(
      "terminal",
    );
  });

  it("channelArticleKindWithChronicleLayoutResolvesToAurora", () => {
    expect(
      resolveChannelTheme({ kind: "ARTICLES", layout: "CHRONICLE" }),
    ).toBe("aurora");
  });
});

describe("resolveEntryTheme", () => {
  it("entryArticleKindOverridesParentChannelTheme", () => {
    expect(
      resolveEntryTheme({ kind: "ARTICLE" }, { kind: "STREAM", layout: "FEED" }),
    ).toBe("ink");
  });
});
