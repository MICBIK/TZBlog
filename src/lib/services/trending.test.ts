import { describe, expect, it } from "vitest";

import {
  computeBaseScore,
  computeTrendingScoreWithBoost,
  DEFAULT_TRENDING_CONFIG,
} from "./trending";

const publishedAt = new Date("2026-01-01T00:00:00.000Z");

describe("trending score", () => {
  it("logarithmicScalingCompressesHighCount", () => {
    const highViews = computeBaseScore(
      {
        status: "PUBLISHED",
        publishedAt,
        viewCount: 10000,
        likeCount: 5,
        commentCount: 3,
      },
      publishedAt,
    );
    const linearViews =
      DEFAULT_TRENDING_CONFIG.weights.view * 10000 +
      DEFAULT_TRENDING_CONFIG.weights.like * 5 +
      DEFAULT_TRENDING_CONFIG.weights.comment * 3;

    expect(highViews).toBeLessThan(linearViews);
    expect(highViews).toBeGreaterThan(0);
  });

  it("exponentialDecayHalvesScoreAtHalfLife", () => {
    const fresh = computeBaseScore(
      {
        status: "PUBLISHED",
        publishedAt,
        viewCount: 100,
        likeCount: 10,
        commentCount: 2,
      },
      publishedAt,
    );
    const aged = computeBaseScore(
      {
        status: "PUBLISHED",
        publishedAt,
        viewCount: 100,
        likeCount: 10,
        commentCount: 2,
      },
      new Date(publishedAt.getTime() + 72 * 60 * 60 * 1000),
    );

    expect(aged).toBeCloseTo(fresh / 2, 5);
  });

  it("weightedSumPrioritizesComments", () => {
    const commentHeavy = computeBaseScore(
      {
        status: "PUBLISHED",
        publishedAt,
        viewCount: 10,
        likeCount: 10,
        commentCount: 100,
      },
      publishedAt,
      {
        weights: { view: 1, like: 3, comment: 5 },
        halfLifeHours: 72,
      },
    );
    const viewHeavy = computeBaseScore(
      {
        status: "PUBLISHED",
        publishedAt,
        viewCount: 100,
        likeCount: 10,
        commentCount: 10,
      },
      publishedAt,
      {
        weights: { view: 1, like: 3, comment: 5 },
        halfLifeHours: 72,
      },
    );

    expect(commentHeavy).toBeGreaterThan(viewHeavy);
  });

  it("draftEntriesGetZeroScore", () => {
    expect(
      computeBaseScore({
        status: "DRAFT",
        publishedAt,
        viewCount: 999,
        likeCount: 999,
        commentCount: 999,
      }),
    ).toBe(0);
  });

  it("newPostBoostGivesEarlyVisibility", () => {
    const now = publishedAt;
    const withBoost = computeTrendingScoreWithBoost(
      {
        status: "PUBLISHED",
        publishedAt: now,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
      },
      now,
    );
    const baseOnly = computeBaseScore(
      {
        status: "PUBLISHED",
        publishedAt: now,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
      },
      now,
    );

    expect(withBoost - baseOnly).toBeCloseTo(0.1, 5);
  });
});
