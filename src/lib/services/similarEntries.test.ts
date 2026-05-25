import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
  testDb,
} from "../../../tests/helpers/db";
import {
  findSimilarEntries,
  jaccardSimilarity,
  tagIdfWeights,
} from "./similarEntries";

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

async function createPublishedEntry(input: {
  slug: string;
  channelId: string;
  tagSlugs?: string[];
  publishedAt?: Date;
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
    include: { tags: true },
  });
}

describe("similarEntries", () => {
  it("tagIdfWeightsRareTagsHigher", async () => {
    const channel = await createChannel("articles");
    await createPublishedEntry({
      slug: "only-rare",
      channelId: channel.id,
      tagSlugs: ["rare-tag"],
    });
    for (let i = 0; i < 10; i += 1) {
      await createPublishedEntry({
        slug: `common-${i}`,
        channelId: channel.id,
        tagSlugs: ["common-tag"],
      });
    }

    const weights = await tagIdfWeights();

    const rareTag = await testDb.tag.findUnique({ where: { slug: "rare-tag" } });
    const commonTag = await testDb.tag.findUnique({ where: { slug: "common-tag" } });
    expect(rareTag).not.toBeNull();
    expect(commonTag).not.toBeNull();
    expect(weights.get(rareTag!.id)! ).toBeGreaterThan(weights.get(commonTag!.id)!);
  });

  it("similarReturnsHighJaccardEntries", async () => {
    const channel = await createChannel("articles");
    const source = await createPublishedEntry({
      slug: "source",
      channelId: channel.id,
      tagSlugs: ["alpha", "beta"],
    });
    await createPublishedEntry({
      slug: "best-match",
      channelId: channel.id,
      tagSlugs: ["alpha", "beta", "gamma"],
    });
    await createPublishedEntry({
      slug: "weak-match",
      channelId: channel.id,
      tagSlugs: ["gamma"],
    });

    const similar = await findSimilarEntries(source.id, 5);
    expect(similar[0]?.slug).toBe("best-match");
  });

  it("similarFallsBackToRecentWhenNoTagOverlap", async () => {
    const channel = await createChannel("articles");
    const source = await createPublishedEntry({
      slug: "source-no-tags",
      channelId: channel.id,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });
    const recent = await createPublishedEntry({
      slug: "recent-sibling",
      channelId: channel.id,
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    const similar = await findSimilarEntries(source.id, 1);
    expect(similar[0]?.id).toBe(recent.id);
  });

  it("jaccardSimilarityUsesWeightedUnion", () => {
    const weights = new Map([
      ["a", 2],
      ["b", 1],
    ]);
    const score = jaccardSimilarity(new Set(["a"]), new Set(["a", "b"]), weights);
    expect(score).toBeCloseTo(2 / 3, 5);
  });
});
