import "dotenv/config";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PostListItem } from "@/lib/services/posts";

const mocks = vi.hoisted(() => ({
  listPosts: vi.fn(),
}));

vi.mock("@/lib/services/posts", () => ({
  listPosts: mocks.listPosts,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listPosts.mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
});

describe("GET /rss.xml", () => {
  it("returns application/rss+xml with channel + items", async () => {
    const first = post({
      slug: "first",
      title: "First Post",
      excerpt: "First excerpt",
      publishedAt: new Date("2026-05-21T00:00:00Z"),
    });
    const second = post({
      slug: "second",
      title: "Second Post",
      excerpt: "Second excerpt",
      publishedAt: new Date("2026-05-20T00:00:00Z"),
    });
    mocks.listPosts.mockResolvedValue({
      items: [first, second],
      total: 2,
      page: 1,
      pageSize: 20,
    });

    const { GET } = await importRoute();
    const response = await GET();
    const body = await response.text();
    const baseUrl = siteUrl();

    expect(response.headers.get("content-type")).toContain(
      "application/rss+xml",
    );
    expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(
      true,
    );
    expect(body).toContain('<rss version="2.0"');
    expect(body).toContain("<channel>");
    expect(body).toContain("<title>TZBlog</title>");
    expect(body).toContain(`<link>${baseUrl}</link>`);
    expect(countItems(body)).toBe(2);
    expect(body).toContain("<title>First Post</title>");
    expect(body).toContain(`<link>${baseUrl}/posts/first</link>`);
    expect(body).toContain(
      `<guid isPermaLink="true">${baseUrl}/posts/first</guid>`,
    );
    expect(body).toContain(
      `<pubDate>${first.publishedAt!.toUTCString()}</pubDate>`,
    );
    expect(body).toContain("<description>First excerpt</description>");
    expect(body).toContain("<title>Second Post</title>");
    expect(body).toContain(`<link>${baseUrl}/posts/second</link>`);
  });

  it("caps items at 20 in publishedAt desc", async () => {
    const items = Array.from({ length: 25 }, (_, index) =>
      post({
        slug: `post-${index + 1}`,
        title: `Post ${index + 1}`,
        publishedAt: new Date(Date.UTC(2026, 4, 21 - index)),
      }),
    );
    mocks.listPosts.mockResolvedValue({
      items: items.slice(0, 20),
      total: 25,
      page: 1,
      pageSize: 20,
    });

    const { GET } = await importRoute();
    const response = await GET();
    const body = await response.text();

    expect(mocks.listPosts).toHaveBeenCalledWith(
      { page: 1, pageSize: 20, status: "PUBLISHED" },
      "zh",
    );
    expect(countItems(body)).toBe(20);
    expect(body).toContain("<title>Post 1</title>");
    expect(body).toContain("<title>Post 20</title>");
    expect(body).not.toContain("<title>Post 21</title>");
  });

  it('includes <atom:link rel="self"> and <lastBuildDate>', async () => {
    mocks.listPosts.mockResolvedValue({
      items: [post({ slug: "rss-self", title: "RSS Self" })],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    const { GET } = await importRoute();
    const response = await GET();
    const body = await response.text();
    const baseUrl = siteUrl();

    expect(body).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(body).toContain(
      `<atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />`,
    );
    expect(body).toMatch(
      /<lastBuildDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT<\/lastBuildDate>/,
    );
  });

  it('escapes &, <, >, ", and \' in title and description', async () => {
    mocks.listPosts.mockResolvedValue({
      items: [
        post({
          slug: "special",
          title: "Tips & tricks <hello>",
          excerpt: 'Use "quoted" & \'single\' > done',
        }),
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    const { GET } = await importRoute();
    const response = await GET();
    const body = await response.text();

    expect(body).toContain(
      "<title>Tips &amp; tricks &lt;hello&gt;</title>",
    );
    expect(body).toContain(
      "<description>Use &quot;quoted&quot; &amp; &apos;single&apos; &gt; done</description>",
    );
    expect(body).not.toContain("<hello>");
    expect(body).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
  });
});

async function importRoute(): Promise<{
  GET: () => Promise<Response>;
}> {
  const modulePath = "./" + "route";
  return (await import(modulePath)) as {
    GET: () => Promise<Response>;
  };
}

function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

function countItems(xml: string): number {
  return [...xml.matchAll(/<item>/g)].length;
}

function post(overrides: Partial<PostListItem> = {}): PostListItem {
  return {
    id: "post-id",
    slug: "post",
    cover: null,
    status: "PUBLISHED",
    publishedAt: new Date("2026-05-21T00:00:00Z"),
    columnId: null,
    columnName: null,
    authorName: "Author",
    title: "Post",
    excerpt: "Excerpt",
    tags: [],
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date("2026-05-21T00:00:00Z"),
    updatedAt: new Date("2026-05-21T00:00:00Z"),
    ...overrides,
  };
}
