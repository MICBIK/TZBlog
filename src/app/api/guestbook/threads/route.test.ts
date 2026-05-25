import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import {
  disconnectTestDb,
  resetAll,
  testDb,
} from "../../../../../tests/helpers/db";
import { POST } from "./route";

async function ensureGuestbookChannel(): Promise<string> {
  const channel = await testDb.channel.upsert({
    where: { slug: "guestbook" },
    update: {},
    create: {
      slug: "guestbook",
      order: 99,
      enabled: true,
      kind: "GUESTBOOK",
      layout: "FEED",
      translations: {
        create: [{ locale: "zh", name: "留言板", description: "私密留言" }],
      },
    },
  });
  return channel.id;
}

async function createVisitor(email: string) {
  return testDb.user.create({
    data: {
      email,
      name: "Visitor",
      role: "VISITOR",
    },
  });
}

beforeEach(async () => {
  await resetAll();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("POST /api/guestbook/threads gb-005", () => {
  it("postCreatesGuestbookThreadEntry", async () => {
    await ensureGuestbookChannel();
    const visitor = await createVisitor("visitor-a@example.com");
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        id: visitor.id,
        email: visitor.email,
        name: visitor.name,
        role: "VISITOR",
      },
    });

    const res = await POST(
      new Request("http://localhost/api/guestbook/threads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "第一条私密留言" }),
      }),
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { id: string } };
    const entry = await testDb.entry.findUnique({ where: { id: body.data.id } });
    expect(entry?.kind).toBe("GUESTBOOK_THREAD");
    expect(entry?.body).toBe("第一条私密留言");
    expect(entry?.authorId).toBe(visitor.id);
  });
});
