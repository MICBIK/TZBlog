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
} from "../../../../../../tests/helpers/db";

type EntryItemRoute = {
  PATCH: (
    req: Request,
    ctx: { params: Promise<{ id: string }> },
  ) => Promise<Response>;
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

describe("PATCH /api/admin/entries/[id]", () => {
  it("publishesArticleAndStampsPublishedAt", async () => {
    const { PATCH } = await loadRoute();
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
    const entry = await testDb.entry.create({
      data: {
        slug: "existing-entry",
        channelId: channel.id,
        authorId,
        kind: "ARTICLE",
        status: "DRAFT",
        body: "旧正文",
        metadata: {
          cover: "/uploads/cover.png",
          readingMinutes: 5,
          toc: true,
          ogImage: null,
        },
        translations: {
          create: [{ locale: "zh", title: "已有条目", excerpt: "旧摘要" }],
        },
      },
    });

    const before = Date.now();
    const res = await PATCH(
      new Request(`http://localhost/api/admin/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PUBLISHED",
          translations: [
            {
              locale: "zh",
              title: "已有条目",
              excerpt: "旧摘要",
              content: "更新后的正文",
            },
          ],
        }),
      }),
      ctx(entry.id),
    );
    const after = Date.now();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({
      id: entry.id,
      slug: "existing-entry",
      status: "PUBLISHED",
    });
    expect(body.data.publishedAt).toBeTruthy();

    const row = await testDb.entry.findUnique({ where: { id: entry.id } });
    expect(row).not.toBeNull();
    expect(row).toMatchObject({
      id: entry.id,
      status: "PUBLISHED",
      body: "更新后的正文",
    });
    const stampedAt = row!.publishedAt!.getTime();
    expect(stampedAt).toBeGreaterThanOrEqual(before - 5000);
    expect(stampedAt).toBeLessThanOrEqual(after + 5000);
  });
});

async function loadRoute(): Promise<EntryItemRoute> {
  const routePath = join(process.cwd(), "src/app/api/admin/entries/[id]/route.ts");
  return import(pathToFileURL(routePath).href) as Promise<EntryItemRoute>;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}
