import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
  testDb,
} from "../../../tests/helpers/db";
import { findNextInSeries, getNextEntry } from "./nextEntry";

let authorId: string;

beforeEach(async () => {
  await resetAll();
  authorId = await ensureTestUser();
});

afterAll(async () => {
  await disconnectTestDb();
});

async function createChannel(slug: string) {
  return testDb.column.create({
    data: {
      slug,
      order: 0,
      enabled: true,
      kind: "ARTICLES",
      layout: "CHRONICLE",
      translations: { create: { locale: "zh", name: slug, description: null } },
    },
  });
}

async function createSeries(channelId: string, slug: string) {
  return testDb.series.create({
    data: {
      slug,
      channelId,
      translations: { create: { locale: "zh", name: slug } },
    },
  });
}

async function createPublishedEntry(input: {
  slug: string;
  channelId: string;
  seriesId?: string;
  seriesOrder?: number;
  publishedAt?: Date;
  tagSlugs?: string[];
}) {
  const tags = input.tagSlugs?.length
    ? {
        create: await Promise.all(
          input.tagSlugs.map(async (slug) => {
            const tag = await testDb.tag.upsert({
              where: { slug },
              update: {},
              create: { slug, name: slug },
            });
            return { tagId: tag.id };
          }),
        ),
      }
    : undefined;

  return testDb.post.create({
    data: {
      slug: input.slug,
      status: "PUBLISHED",
      publishedAt: input.publishedAt ?? new Date("2026-01-01T00:00:00.000Z"),
      authorId,
      channelId: input.channelId,
      kind: "ARTICLE",
      seriesId: input.seriesId,
      seriesOrder: input.seriesOrder,
      translations: {
        create: {
          locale: "zh",
          title: input.slug,
          excerpt: null,
          content: "body",
        },
      },
      tags,
    },
  });
}

describe("nextEntry", () => {
  it("seriesNextReturnsCorrectOrder", async () => {
    const channel = await createChannel("articles");
    const series = await createSeries(channel.id, "guide");
    const current = await createPublishedEntry({
      slug: "part-2",
      channelId: channel.id,
      seriesId: series.id,
      seriesOrder: 2,
    });
    await createPublishedEntry({
      slug: "part-3",
      channelId: channel.id,
      seriesId: series.id,
      seriesOrder: 3,
    });

    const next = await findNextInSeries(current.id);
    expect(next?.slug).toBe("part-3");
  });

  it("seriesEndReturnsNull", async () => {
    const channel = await createChannel("articles");
    const series = await createSeries(channel.id, "guide");
    const last = await createPublishedEntry({
      slug: "part-final",
      channelId: channel.id,
      seriesId: series.id,
      seriesOrder: 9,
    });

    expect(await findNextInSeries(last.id)).toBeNull();
  });

  it("getNextEntrySeriesReason", async () => {
    const channel = await createChannel("articles");
    const series = await createSeries(channel.id, "guide");
    const current = await createPublishedEntry({
      slug: "part-1",
      channelId: channel.id,
      seriesId: series.id,
      seriesOrder: 1,
    });
    await createPublishedEntry({
      slug: "part-2",
      channelId: channel.id,
      seriesId: series.id,
      seriesOrder: 2,
    });

    const result = await getNextEntry(current.id);
    expect(result.reason).toBe("series");
    expect(result.entry?.slug).toBe("part-2");
  });

  it("getNextEntrySimilarReason", async () => {
    const channel = await createChannel("articles");
    const current = await createPublishedEntry({
      slug: "current",
      channelId: channel.id,
      tagSlugs: ["shared"],
    });
    await createPublishedEntry({
      slug: "similar-target",
      channelId: channel.id,
      tagSlugs: ["shared", "extra"],
    });

    const result = await getNextEntry(current.id);
    expect(result.reason).toBe("similar");
    expect(result.entry?.slug).toBe("similar-target");
  });

  it("getNextEntryRecentReason", async () => {
    const channel = await createChannel("articles");
    const older = await createPublishedEntry({
      slug: "older",
      channelId: channel.id,
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const current = await createPublishedEntry({
      slug: "current",
      channelId: channel.id,
      publishedAt: new Date("2026-01-03T00:00:00.000Z"),
    });

    const result = await getNextEntry(current.id);
    expect(result.reason).toBe("recent");
    expect(result.entry?.id).toBe(older.id);
  });
});
