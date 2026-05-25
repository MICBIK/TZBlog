import { describe, expect, it } from "vitest";

import {
  previewLimitForKind,
  resolveTrendingEntries,
} from "./homePageLogic";

describe("previewLimitForKind", () => {
  it("articlesChannelShowsTop3Entries", () => {
    expect(previewLimitForKind("ARTICLES")).toBe(3);
  });

  it("streamChannelShowsTop5Entries", () => {
    expect(previewLimitForKind("STREAM")).toBe(5);
  });
});

describe("resolveTrendingEntries", () => {
  const recency = [
    { id: "a", trendingScore: 0, publishedAt: new Date("2026-05-24T00:00:00Z") },
    { id: "b", trendingScore: 0, publishedAt: new Date("2026-05-23T00:00:00Z") },
    { id: "c", trendingScore: 0, publishedAt: new Date("2026-05-22T00:00:00Z") },
  ];

  it("trendingReadsByScoreDesc", () => {
    const byScore = [
      { id: "hot", trendingScore: 9.5, publishedAt: new Date("2026-05-20T00:00:00Z") },
      { id: "warm", trendingScore: 4.2, publishedAt: new Date("2026-05-21T00:00:00Z") },
    ];

    expect(resolveTrendingEntries(byScore, recency).map((row) => row.id)).toEqual([
      "hot",
      "warm",
    ]);
  });

  it("trendingFallsBackToPublishedAtDesc", () => {
    const byScore = recency.map((row) => ({ ...row, trendingScore: 0 }));

    expect(resolveTrendingEntries(byScore, recency).map((row) => row.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});
