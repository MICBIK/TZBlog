import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
  testDb,
} from "../../../../../tests/helpers/db";

type EntriesRoute = {
  POST: (req: Request) => Promise<Response>;
};

let authorId: string;

beforeEach(async () => {
  await resetAll();
  authorId = await ensureTestUser("admin@example.com");
  (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: authorId, email: "admin@example.com" },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  });
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("POST /api/admin/entries", () => {
  it("createsDraftArticleEntry", async () => {
    const { POST } = await loadRoute();
    const channel = await testDb.channel.create({
      data: {
        slug: "articles",
        order: 0,
        enabled: true,
        kind: "ARTICLES",
        layout: "CHRONICLE",
        translations: {
          create: [{ locale: "zh", name: "文章", description: null }],
        },
      },
    });

    const res = await POST(
      new Request("http://localhost/api/admin/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "new-entry",
          channelId: channel.id,
          kind: "ARTICLE",
          status: "DRAFT",
          metadata: {
            cover: "/uploads/cover.png",
            toc: true,
          },
          tags: [],
          translations: [
            {
              locale: "zh",
              title: "新条目",
              excerpt: "摘要",
              content: "正文",
            },
          ],
        }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({
      slug: "new-entry",
      kind: "ARTICLE",
      status: "DRAFT",
      channelId: channel.id,
    });

    const row = await testDb.entry.findUnique({ where: { id: body.data.id } });
    expect(row).not.toBeNull();
    expect(row).toMatchObject({
      slug: "new-entry",
      kind: "ARTICLE",
      status: "DRAFT",
      channelId: channel.id,
      authorId,
      body: "正文",
    });
  });

  it("returns400WhenLinkMetadataIsInvalid", async () => {
    const { POST } = await loadRoute();
    const channel = await testDb.channel.create({
      data: {
        slug: "notes",
        order: 1,
        enabled: true,
        kind: "NOTES",
        layout: "TIMELINE",
        translations: {
          create: [{ locale: "zh", name: "笔记", description: null }],
        },
      },
    });

    const res = await POST(
      new Request("http://localhost/api/admin/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "invalid-link-entry",
          channelId: channel.id,
          kind: "LINK",
          status: "DRAFT",
          metadata: {
            sourceTitle: "无链接来源",
          },
          tags: [],
          translations: [
            {
              locale: "zh",
              title: "无效链接",
              excerpt: null,
              content: "正文",
            },
          ],
        }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

async function loadRoute(): Promise<EntriesRoute> {
  const routePath = join(process.cwd(), "src/app/api/admin/entries/route.ts");
  return import(pathToFileURL(routePath).href) as Promise<EntriesRoute>;
}
