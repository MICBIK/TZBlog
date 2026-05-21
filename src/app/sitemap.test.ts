import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MetadataRoute } from "next";

import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
  testDb,
} from "../../tests/helpers/db";

let authorId: string;

beforeEach(async () => {
  await resetAll();
  authorId = await ensureTestUser();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("sitemap", () => {
  it("includes static routes + published posts + columns", async () => {
    const [firstPost, secondPost, thirdPost] = await Promise.all([
      createPost("published-one", "PUBLISHED"),
      createPost("published-two", "PUBLISHED"),
      createPost("published-three", "PUBLISHED"),
    ]);
    await Promise.all([createColumn("tech"), createColumn("notes")]);

    const { default: sitemap } = await importSitemap();
    const entries = await sitemap();
    const baseUrl = siteUrl();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        `${baseUrl}/`,
        `${baseUrl}/posts`,
        `${baseUrl}/about`,
        `${baseUrl}/posts/${firstPost.slug}`,
        `${baseUrl}/posts/${secondPost.slug}`,
        `${baseUrl}/posts/${thirdPost.slug}`,
        `${baseUrl}/columns/tech`,
        `${baseUrl}/columns/notes`,
      ]),
    );
    expect(urls.every((url) => url.startsWith(baseUrl))).toBe(true);

    const firstPostEntry = entries.find(
      (entry) => entry.url === `${baseUrl}/posts/${firstPost.slug}`,
    );
    expect(firstPostEntry?.lastModified).toEqual(firstPost.updatedAt);
  });

  it("skips DRAFT and ARCHIVED posts", async () => {
    await Promise.all([
      createPost("live-only", "PUBLISHED"),
      createPost("draft-post", "DRAFT"),
      createPost("archived-post", "ARCHIVED"),
    ]);

    const { default: sitemap } = await importSitemap();
    const entries = await sitemap();
    const baseUrl = siteUrl();
    const postUrls = entries
      .map((entry) => entry.url)
      .filter((url) => url.startsWith(`${baseUrl}/posts/`));

    expect(postUrls).toEqual([`${baseUrl}/posts/live-only`]);
  });

  it("walks pagination for >1000 PUBLISHED posts", async () => {
    await seedPublishedPostsForSitemap(1050);

    const { default: sitemap } = await importSitemap();
    const entries = await sitemap();
    const baseUrl = siteUrl();
    const postUrls = entries
      .map((entry) => entry.url)
      .filter((url) => url.startsWith(`${baseUrl}/posts/`));

    expect(postUrls).toHaveLength(1050);
    expect(postUrls).toContain(`${baseUrl}/posts/sitemap-published-0`);
    expect(postUrls).toContain(`${baseUrl}/posts/sitemap-published-1049`);
  });
});

function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

async function importSitemap(): Promise<{
  default: () => Promise<MetadataRoute.Sitemap>;
}> {
  const modulePath = "./" + "sitemap";
  return (await import(modulePath)) as {
    default: () => Promise<MetadataRoute.Sitemap>;
  };
}

async function createPost(
  slug: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
) {
  return testDb.post.create({
    data: {
      slug,
      status,
      publishedAt:
        status === "PUBLISHED" ? new Date("2026-05-21T00:00:00Z") : null,
      authorId,
      translations: {
        create: {
          locale: "zh",
          title: slug,
          excerpt: `${slug} excerpt`,
          content: `${slug} content`,
        },
      },
    },
  });
}

async function createColumn(slug: string) {
  return testDb.column.create({
    data: {
      slug,
      translations: {
        create: {
          locale: "zh",
          name: slug,
          description: `${slug} description`,
        },
      },
    },
  });
}

async function seedPublishedPostsForSitemap(count: number): Promise<void> {
  await testDb.post.createMany({
    data: Array.from({ length: count }, (_, index) => ({
      id: `sitemap-published-${index}-id`,
      slug: `sitemap-published-${index}`,
      status: "PUBLISHED" as const,
      publishedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)),
      authorId,
    })),
  });
}
