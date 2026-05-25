import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
  testDb,
} from "../../../../../../tests/helpers/db";
import { POST } from "./route";

let authorId: string;
let channelId: string;

beforeEach(async () => {
  await resetAll();
  authorId = await ensureTestUser();
  const channel = await testDb.channel.create({
    data: {
      slug: "stream",
      order: 0,
      enabled: true,
      kind: "STREAM",
      layout: "GREP",
      translations: {
        create: [{ locale: "zh", name: "Stream", description: null }],
      },
    },
  });
  channelId = channel.id;
});

afterAll(async () => {
  await disconnectTestDb();
});

async function makeEntry(slug = "entry-view-test"): Promise<string> {
  const entry = await testDb.post.create({
    data: {
      slug,
      kind: "NOTE",
      status: "PUBLISHED",
      channelId,
      authorId,
      body: "body",
      publishedAt: new Date("2026-05-21T00:00:00Z"),
      translations: {
        create: [{ locale: "zh", title: "Title", excerpt: null, content: "body" }],
      },
    },
  });
  return entry.id as string;
}

function mkReq(
  url: string,
  init: { method?: string; ip?: string; ua?: string } = {},
): Request {
  return new Request(url, {
    method: init.method ?? "POST",
    headers: {
      "x-forwarded-for": init.ip ?? "1.1.1.1",
      "user-agent": init.ua ?? "test-agent",
    },
  });
}

describe("POST /api/entries/[id]/view", () => {
  it("firstVisitIncrementsViewCountAndWritesEntryView", async () => {
    const entryId = await makeEntry();

    const res = await POST(mkReq(`http://localhost/api/entries/${entryId}/view`), {
      params: Promise.resolve({ id: entryId }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { counted: boolean; viewCount: number };
    };
    expect(body.data).toEqual({ counted: true, viewCount: 1 });

    const views = await testDb.postView.findMany({ where: { postId: entryId } });
    expect(views).toHaveLength(1);
  });

  it("sameVisitorSameDayDoesNotIncrementViewCount", async () => {
    const entryId = await makeEntry("entry-view-dedupe");

    const req = mkReq(`http://localhost/api/entries/${entryId}/view`, {
      ip: "10.0.0.9",
      ua: "dedupe-agent",
    });
    const ctx = { params: Promise.resolve({ id: entryId }) };

    const first = await POST(req, ctx);
    expect((await first.json()).data).toEqual({ counted: true, viewCount: 1 });

    const second = await POST(req, ctx);
    expect((await second.json()).data).toEqual({ counted: false, viewCount: 1 });

    const views = await testDb.postView.findMany({ where: { postId: entryId } });
    expect(views).toHaveLength(1);
  });
});
