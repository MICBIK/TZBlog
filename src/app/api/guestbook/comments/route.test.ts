import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
  testDb,
} from "../../../../../tests/helpers/db";
import { POST } from "./route";

async function ensureGuestbookChannel() {
  return testDb.channel.upsert({
    where: { slug: "guestbook" },
    update: {},
    create: {
      slug: "guestbook",
      order: 99,
      enabled: true,
      kind: "GUESTBOOK",
      layout: "FEED",
      translations: {
        create: [{ locale: "zh", name: "留言板", description: null }],
      },
    },
  });
}

async function createThread(authorId: string, channelId: string) {
  return testDb.entry.create({
    data: {
      slug: `gb-test-${authorId.slice(-6)}`,
      kind: "GUESTBOOK_THREAD",
      status: "PUBLISHED",
      channelId,
      authorId,
      body: "opening message",
      publishedAt: new Date(),
      metadata: {
        visibility: "PRIVATE_TO_AUTHOR",
        visitorName: "Visitor",
        resolved: false,
      },
      translations: {
        create: [{ locale: "zh", title: "留言", excerpt: null }],
      },
    },
  });
}

beforeEach(async () => {
  await resetAll();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("POST /api/guestbook/comments", () => {
  it("visitorReplyCreatesPrivateComment", async () => {
    const channel = await ensureGuestbookChannel();
    const visitor = await testDb.user.create({
      data: {
        email: "visitor-a@example.com",
        name: "Visitor A",
        role: "VISITOR",
      },
    });
    const thread = await createThread(visitor.id, channel.id);

    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        id: visitor.id,
        email: visitor.email,
        name: visitor.name,
        role: "VISITOR",
      },
    });

    const res = await POST(
      new Request("http://localhost/api/guestbook/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          threadId: thread.id,
          content: "follow up from visitor",
        }),
      }),
    );

    expect(res.status).toBe(201);
    const comment = await testDb.comment.findFirst({
      where: { entryId: thread.id, authorUserId: visitor.id },
    });
    expect(comment?.visibility).toBe("PRIVATE_TO_THREAD");
    expect(comment?.content).toBe("follow up from visitor");
  });

  it("adminReplyCreatesPrivateComment", async () => {
    const channel = await ensureGuestbookChannel();
    const visitor = await testDb.user.create({
      data: {
        email: "visitor-a@example.com",
        name: "Visitor A",
        role: "VISITOR",
      },
    });
    const adminId = await ensureTestUser("admin@example.com");
    const thread = await createThread(visitor.id, channel.id);

    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        id: adminId,
        email: "admin@example.com",
        name: "Admin",
        role: "ADMIN",
      },
    });

    const res = await POST(
      new Request("http://localhost/api/guestbook/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          threadId: thread.id,
          content: "admin reply",
        }),
      }),
    );

    expect(res.status).toBe(201);
    const comment = await testDb.comment.findFirst({
      where: { entryId: thread.id, authorUserId: adminId },
    });
    expect(comment?.visibility).toBe("PRIVATE_TO_THREAD");
    expect(comment?.content).toBe("admin reply");
  });

  it("guestbookCommentRateLimit3In5min", async () => {
    const channel = await ensureGuestbookChannel();
    const visitor = await testDb.user.create({
      data: {
        email: "limited@example.com",
        name: "Limited Visitor",
        role: "VISITOR",
      },
    });
    const thread = await createThread(visitor.id, channel.id);

    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        id: visitor.id,
        email: visitor.email,
        name: visitor.name,
        role: "VISITOR",
      },
    });

    const mkReq = (content: string) =>
      new Request("http://localhost/api/guestbook/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: thread.id, content }),
      });

    for (let i = 0; i < 3; i += 1) {
      const res = await POST(mkReq(`message ${i}`));
      expect(res.status).toBe(201);
    }

    const blocked = await POST(mkReq("fourth message"));
    expect(blocked.status).toBe(429);
  });
});
