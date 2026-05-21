import "dotenv/config";

import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PostWithRelations } from "@/lib/services/posts";

const mocks = vi.hoisted(() => ({
  getPostBySlug: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/lib/services/posts", () => ({
  getPostBySlug: mocks.getPostBySlug,
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.notFound.mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  });
});

describe("post opengraph-image", () => {
  it("returns image/png response for published post", async () => {
    mocks.getPostBySlug.mockResolvedValue(
      post({ slug: "hello", status: "PUBLISHED", title: "Hello World" }),
    );

    const { default: OgImage, size } = await importOgImage();
    const response = await OgImage({
      params: Promise.resolve({ slug: "hello" }),
    });

    expect(size).toEqual({ width: 1200, height: 630 });
    expect(mocks.getPostBySlug).toHaveBeenCalledWith("hello");
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(1000);
  });

  it("calls notFound when post missing or not published", async () => {
    const { default: OgImage } = await importOgImage();

    for (const value of [
      null,
      post({ slug: "draft", status: "DRAFT" }),
      post({ slug: "archived", status: "ARCHIVED" }),
    ]) {
      vi.clearAllMocks();
      mocks.notFound.mockImplementation(() => {
        throw new Error("NEXT_NOT_FOUND");
      });
      mocks.getPostBySlug.mockResolvedValue(value);

      await expect(
        OgImage({
          params: Promise.resolve({ slug: value?.slug ?? "missing" }),
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mocks.notFound).toHaveBeenCalledTimes(1);
    }
  });

  it("uses promise-only params prop shape", () => {
    const source = readFileSync(
      new URL("./opengraph-image.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("params: Promise<{ slug: string }>");
    expect(source).not.toContain(
      "params: { slug: string } | Promise<{ slug: string }>",
    );
  });
});

async function importOgImage(): Promise<{
  default: (props: {
    params: Promise<{ slug: string }>;
  }) => Promise<Response>;
  size: { width: 1200; height: 630 };
  contentType: "image/png";
}> {
  const modulePath = "./" + "opengraph-image";
  return (await import(modulePath)) as {
    default: (props: {
      params: Promise<{ slug: string }>;
    }) => Promise<Response>;
    size: { width: 1200; height: 630 };
    contentType: "image/png";
  };
}

function post(
  overrides: Partial<PostWithRelations> & { title?: string } = {},
): PostWithRelations {
  const title = overrides.title ?? "Post Title";

  return {
    id: "post-id",
    slug: "post",
    cover: null,
    status: "PUBLISHED",
    publishedAt: new Date("2026-05-21T00:00:00Z"),
    authorId: "author-id",
    columnId: null,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date("2026-05-21T00:00:00Z"),
    updatedAt: new Date("2026-05-21T00:00:00Z"),
    translations: [
      {
        id: "tr-id",
        postId: "post-id",
        locale: "zh",
        title,
        excerpt: "Excerpt",
        content: "Content",
      },
    ],
    column: null,
    tags: [],
    author: { id: "author-id", email: "author@example.com", name: "Author" },
    ...overrides,
  } as PostWithRelations;
}
