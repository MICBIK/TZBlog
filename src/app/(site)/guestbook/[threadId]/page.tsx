import { notFound } from "next/navigation";

import { GuestbookReplyForm } from "@/components/guestbook/GuestbookReplyForm";
import { ThreadView } from "@/components/guestbook/ThreadView";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import {
  buildGuestbookMessages,
  getGuestbookThreadForViewer,
} from "@/lib/services/guestbook";

type PageProps = {
  params: Promise<{ threadId: string }>;
};

export default async function GuestbookThreadPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const { threadId } = await params;
  let thread;

  try {
    thread = await getGuestbookThreadForViewer(threadId, {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email,
      name: session.user.name,
    });
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const messages = buildGuestbookMessages(thread);

  return (
    <main className="mx-auto max-w-3xl space-y-8 py-10">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-normal text-muted-fg">
          guestbook thread
        </p>
        <h1 className="text-3xl font-semibold">
          {session.user.role === "ADMIN"
            ? `${thread.author.name} 的对话`
            : "我的对话"}
        </h1>
      </header>

      <ThreadView messages={messages} />
      <GuestbookReplyForm threadId={thread.id} />
    </main>
  );
}
