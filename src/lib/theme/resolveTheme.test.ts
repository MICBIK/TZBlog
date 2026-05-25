import { describe, expect, it } from "vitest";

import { resolveChannelTheme } from "./resolveTheme";

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
