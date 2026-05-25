import { db } from "@/lib/db";
import { errors } from "@/lib/errors";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { guestbookMessageSchema } from "@/lib/schemas/guestbookMessage";
import { hashIdentifier } from "@/lib/security/hash";
import { checkRateLimit, recordRateLimit } from "@/lib/security/rateLimit";
import { createPrivateThreadComment } from "@/lib/services/comments";

const GUESTBOOK_MESSAGE_LIMIT = {
  scope: "guestbook:message",
  windowSeconds: 5 * 60,
  maxCount: 3,
} as const;

export type GuestbookSessionUser = {
  id: string;
  role: string;
  email?: string | null;
  name?: string | null;
};

export type GuestbookMessage = {
  id: string;
  authorUserId: string | null;
  authorName: string;
  content: string;
  createdAt: Date;
  isOpeningMessage?: boolean;
};

export type GuestbookThreadSummary = {
  id: string;
  slug: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  resolved: boolean;
  author: {
    id: string;
    name: string;
    email: string;
  };
  messageCount: number;
};

export async function getGuestbookChannelId(): Promise<string> {
  const channel = await db.channel.findUnique({
    where: { slug: "guestbook" },
    select: { id: true },
  });
  if (!channel) {
    throw errors.notFound("Guestbook channel not found");
  }
  return channel.id;
}

export async function enforceGuestbookMessageRateLimit(
  userId: string,
): Promise<void> {
  const key = await hashIdentifier(`guestbook:${userId}`);
  const exceeded = await checkRateLimit({
    ...GUESTBOOK_MESSAGE_LIMIT,
    key,
  });
  if (exceeded) {
    throw errors.rateLimited("留言过于频繁，请稍后再试");
  }
}

export async function recordGuestbookMessageRateLimit(
  userId: string,
): Promise<void> {
  const key = await hashIdentifier(`guestbook:${userId}`);
  await recordRateLimit({ scope: GUESTBOOK_MESSAGE_LIMIT.scope, key });
}

export async function findVisitorThread(userId: string) {
  return db.entry.findFirst({
    where: { kind: "GUESTBOOK_THREAD", authorId: userId },
    include: {
      author: { select: { id: true, name: true, email: true } },
      comments: {
        where: { visibility: "PRIVATE_TO_THREAD" },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function listGuestbookThreadsForAdmin(): Promise<
  GuestbookThreadSummary[]
> {
  const threads = await db.entry.findMany({
    where: { kind: "GUESTBOOK_THREAD" },
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { id: true, name: true, email: true } },
      comments: {
        where: { visibility: "PRIVATE_TO_THREAD" },
        select: { id: true },
      },
    },
  });

  return threads.map((thread) => ({
    id: thread.id,
    slug: thread.slug,
    body: thread.body,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    resolved: readResolvedFlag(thread.metadata),
    author: {
      id: thread.author.id,
      name: thread.author.name,
      email: thread.author.email,
    },
    messageCount: thread.comments.length + 1,
  }));
}

export async function getGuestbookThreadForViewer(
  threadId: string,
  viewer: GuestbookSessionUser,
) {
  const thread = await db.entry.findFirst({
    where: { id: threadId, kind: "GUESTBOOK_THREAD" },
    include: {
      author: { select: { id: true, name: true, email: true } },
      comments: {
        where: { visibility: "PRIVATE_TO_THREAD" },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!thread) {
    throw errors.notFound("Thread not found");
  }

  if (viewer.role !== "ADMIN" && thread.authorId !== viewer.id) {
    throw errors.notFound("Thread not found");
  }

  return thread;
}

export function buildGuestbookMessages(
  thread: Awaited<ReturnType<typeof getGuestbookThreadForViewer>>,
): GuestbookMessage[] {
  const opening: GuestbookMessage = {
    id: `opening:${thread.id}`,
    authorUserId: thread.authorId,
    authorName: thread.author.name,
    content: thread.body,
    createdAt: thread.createdAt,
    isOpeningMessage: true,
  };

  const replies = thread.comments.map((comment) => ({
    id: comment.id,
    authorUserId: comment.authorUserId,
    authorName: comment.authorName,
    content: comment.content,
    createdAt: comment.createdAt,
  }));

  return [opening, ...replies];
}

export async function createGuestbookThread(
  viewer: GuestbookSessionUser,
  rawContent: unknown,
) {
  if (viewer.role !== "VISITOR") {
    throw errors.forbidden("Only visitors can start guestbook threads");
  }

  const { content } = guestbookMessageSchema.parse({ content: rawContent });
  const existing = await findVisitorThread(viewer.id);
  if (existing) {
    throw errors.conflict("You already have an active guestbook thread");
  }

  await enforceGuestbookMessageRateLimit(viewer.id);

  const channelId = await getGuestbookChannelId();
  const slug = `gb-${viewer.id.slice(-8)}-${Date.now().toString(36)}`;

  const thread = await db.entry.create({
    data: {
      slug,
      kind: "GUESTBOOK_THREAD",
      status: "PUBLISHED",
      channelId,
      authorId: viewer.id,
      body: content,
      publishedAt: new Date(),
      metadata: {
        visibility: "PRIVATE_TO_AUTHOR",
        visitorName: viewer.name ?? viewer.email ?? "Visitor",
        visitorEmail: viewer.email ?? undefined,
        resolved: false,
      },
      translations: {
        create: [
          {
            locale: DEFAULT_LOCALE,
            title: "留言对话",
            excerpt: null,
          },
        ],
      },
    },
    select: { id: true, slug: true, body: true, createdAt: true },
  });

  await recordGuestbookMessageRateLimit(viewer.id);
  return thread;
}

export async function createGuestbookReply(
  viewer: GuestbookSessionUser,
  threadId: string,
  rawContent: unknown,
) {
  const { content } = guestbookMessageSchema.parse({ content: rawContent });
  await getGuestbookThreadForViewer(threadId, viewer);
  await enforceGuestbookMessageRateLimit(viewer.id);

  const comment = await createPrivateThreadComment({
    entryId: threadId,
    authorUserId: viewer.id,
    content,
  });

  await db.entry.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });

  await recordGuestbookMessageRateLimit(viewer.id);
  return comment;
}

export async function markGuestbookThreadResolved(threadId: string) {
  const thread = await db.entry.findFirst({
    where: { id: threadId, kind: "GUESTBOOK_THREAD" },
    select: { id: true, metadata: true },
  });
  if (!thread) {
    throw errors.notFound("Thread not found");
  }

  const metadata =
    typeof thread.metadata === "object" && thread.metadata !== null
      ? { ...(thread.metadata as Record<string, unknown>) }
      : {};

  return db.entry.update({
    where: { id: threadId },
    data: {
      metadata: {
        ...metadata,
        resolved: true,
      },
    },
    select: { id: true, metadata: true },
  });
}

function readResolvedFlag(metadata: unknown): boolean {
  if (typeof metadata !== "object" || metadata === null) return false;
  return (metadata as { resolved?: unknown }).resolved === true;
}
