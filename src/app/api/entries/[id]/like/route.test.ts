import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
  testDb,
} from "../../../../../../tests/helpers/db";
import { GET, POST } from "./route";

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

async function makeEntry(slug = "entry-like-test"): Promise<string> {
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
    method: init.method ?? "GET",
    headers: {
      "x-forwarded-for": init.ip ?? "1.1.1.1",
      "user-agent": init.ua ?? "test-agent",
    },
  });
}

describe("POST /api/entries/[id]/like", () => {
  it("toggleLikeIncrementsThenDecrementsLikeCount", async () => {
    const entryId = await makeEntry();
    const ctx = { params: Promise.resolve({ id: entryId }) };
    const req = mkReq(`http://localhost/api/entries/${entryId}/like`, {
      method: "POST",
      ip: "10.0.0.3",
      ua: "like-agent",
    });

    const likeRes = await POST(req, ctx);
    expect(likeRes.status).toBe(200);
    expect((await likeRes.json()).data).toEqual({ liked: true, likeCount: 1 });

    const getLiked = await GET(req, ctx);
    expect((await getLiked.json()).data).toEqual({ liked: true, likeCount: 1 });

    const unlikeRes = await POST(req, ctx);
    expect((await unlikeRes.json()).data).toEqual({ liked: false, likeCount: 0 });

    const likes = await testDb.postLike.findMany({ where: { postId: entryId } });
    expect(likes).toHaveLength(0);
  });
});
