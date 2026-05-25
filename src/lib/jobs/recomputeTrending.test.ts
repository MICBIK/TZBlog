import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
  testDb,
} from "../../../tests/helpers/db";
import { recomputeAllTrending } from "./recomputeTrending";

let authorId: string;

beforeEach(async () => {
  await resetAll();
  authorId = await ensureTestUser();
});

afterAll(async () => {
  await disconnectTestDb();
});

async function createPublishedEntry(slug: string, counts: {
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}) {
  const channel = await testDb.column.create({
    data: {
      slug: `channel-${slug}`,
      order: 0,
      enabled: true,
      kind: "ARTICLES",
      layout: "CHRONICLE",
      translations: { create: { locale: "zh", name: "文章", description: null } },
    },
  });

  return testDb.post.create({
    data: {
      slug,
      status: "PUBLISHED",
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
      authorId,
      channelId: channel.id,
      kind: "ARTICLE",
      viewCount: counts.viewCount ?? 0,
      likeCount: counts.likeCount ?? 0,
      commentCount: counts.commentCount ?? 0,
      translations: {
        create: { locale: "zh", title: slug, excerpt: null, content: "body" },
      },
    },
  });
}

describe("recomputeAllTrending", () => {
  it("recomputeAllUpdatesAllPublishedEntries", async () => {
    const a = await createPublishedEntry("trend-a", {
      viewCount: 100,
      likeCount: 5,
      commentCount: 2,
    });
    const b = await createPublishedEntry("trend-b", {
      viewCount: 10,
      likeCount: 1,
      commentCount: 0,
    });

    await recomputeAllTrending();

    const updatedA = await testDb.post.findUnique({ where: { id: a.id } });
    const updatedB = await testDb.post.findUnique({ where: { id: b.id } });

    expect(updatedA?.trendingScore ?? 0).toBeGreaterThan(0);
    expect(updatedB?.trendingScore ?? 0).toBeGreaterThan(0);
    expect(updatedA!.trendingScore).toBeGreaterThan(updatedB!.trendingScore);
  });
});
