import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
  testDb,
} from "../../../tests/helpers/db";

interface PublicTagListItem {
  slug: string;
  name: string;
  count: number;
}

interface PublicTag {
  id: string;
  slug: string;
  name: string;
}

let authorId: string;

beforeEach(async () => {
  await resetAll();
  authorId = await ensureTestUser();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("public tags service", () => {
  it("listAllTagsWithCount returns tags sorted by count desc, name asc", async () => {
    await seedTagsWithPublishedAndDraftPosts();
    const { listAllTagsWithCount } = await loadTagsPublicService();

    const tags = await listAllTagsWithCount("zh");

    expect(tags).toEqual([
      { slug: "foo", name: "Foo", count: 3 },
      { slug: "bar", name: "Bar", count: 1 },
      { slug: "baz", name: "Baz", count: 0 },
    ]);
  });

  it("listAllTagsWithCount returns empty on empty DB", async () => {
    const { listAllTagsWithCount } = await loadTagsPublicService();

    await expect(listAllTagsWithCount("zh")).resolves.toEqual([]);
  });

  it("getTagBySlug returns tag", async () => {
    const tag = await testDb.tag.create({
      data: { slug: "foo", name: "Foo" },
    });
    const { getTagBySlug } = await loadTagsPublicService();

    await expect(getTagBySlug("foo")).resolves.toEqual({
      id: tag.id,
      slug: "foo",
      name: "Foo",
    });
  });

  it("getTagBySlug returns null when missing", async () => {
    const { getTagBySlug } = await loadTagsPublicService();

    await expect(getTagBySlug("missing")).resolves.toBeNull();
  });
});

const tagsPublicModulePath = "./tags-public";

async function loadTagsPublicService() {
  return (await vi.importActual(tagsPublicModulePath)) as {
    listAllTagsWithCount: (locale: string) => Promise<PublicTagListItem[]>;
    getTagBySlug: (slug: string) => Promise<PublicTag | null>;
  };
}

async function seedTagsWithPublishedAndDraftPosts() {
  const [foo, bar, baz] = await Promise.all([
    testDb.tag.create({ data: { slug: "foo", name: "Foo" } }),
    testDb.tag.create({ data: { slug: "bar", name: "Bar" } }),
    testDb.tag.create({ data: { slug: "baz", name: "Baz" } }),
  ]);

  await Promise.all([
    createTestArticleWithTag("foo-1", "PUBLISHED", foo.id),
    createTestArticleWithTag("foo-2", "PUBLISHED", foo.id),
    createTestArticleWithTag("foo-3", "PUBLISHED", foo.id),
    createTestArticleWithTag("bar-1", "PUBLISHED", bar.id),
    createTestArticleWithTag("baz-draft-1", "DRAFT", baz.id),
    createTestArticleWithTag("baz-draft-2", "DRAFT", baz.id),
  ]);
}

async function createTestArticleWithTag(
  slug: string,
  status: "DRAFT" | "PUBLISHED",
  tagId: string,
) {
  const post = await testDb.post.create({
    data: {
      slug,
      authorId,
      status,
      publishedAt: status === "PUBLISHED" ? new Date("2026-05-22T00:00:00Z") : null,
      translations: {
        create: [{ locale: "zh", title: slug, content: slug }],
      },
    },
  });

  await testDb.tagsOnPosts.create({
    data: { postId: post.id, tagId },
  });
}
