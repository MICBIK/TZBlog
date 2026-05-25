import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
  testDb,
} from "../../../../../../tests/helpers/db";
import { PATCH } from "./route";

beforeEach(async () => {
  await resetAll();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("PATCH /api/guestbook/threads/[id] gb-009", () => {
  it("adminCanMarkResolved", async () => {
    const adminId = await ensureTestUser("admin@example.com");
    const channel = await testDb.channel.create({
      data: {
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
    const visitor = await testDb.user.create({
      data: {
        email: "visitor@example.com",
        name: "Visitor",
        role: "VISITOR",
      },
    });
    const thread = await testDb.entry.create({
      data: {
        slug: "gb-resolved-test",
        kind: "GUESTBOOK_THREAD",
        status: "PUBLISHED",
        channelId: channel.id,
        authorId: visitor.id,
        body: "hello",
        publishedAt: new Date(),
        metadata: { resolved: false, visitorName: "Visitor" },
        translations: {
          create: [{ locale: "zh", title: "留言", excerpt: null }],
        },
      },
    });

    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: adminId, email: "admin@example.com", role: "ADMIN" },
    });

    const res = await PATCH(new Request("http://localhost", { method: "PATCH" }), {
      params: Promise.resolve({ id: thread.id }),
    });

    expect(res.status).toBe(200);
    const updated = await testDb.entry.findUnique({ where: { id: thread.id } });
    expect((updated?.metadata as { resolved?: boolean }).resolved).toBe(true);
  });
});
