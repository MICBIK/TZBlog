import type { GuestbookMessage } from "@/lib/services/guestbook";

import { GuestbookReplyForm } from "./GuestbookReplyForm";
import { ThreadView } from "./ThreadView";

export function GuestbookVisitorThread({
  threadId,
  messages,
}: {
  threadId: string;
  messages: GuestbookMessage[];
}) {
  return (
    <section className="rounded-lg border border-border p-6" data-testid="guestbook-visitor-thread">
      <h2 className="text-xl font-semibold">我的对话</h2>
      <div className="mt-6">
        <ThreadView messages={messages} />
      </div>
      <GuestbookReplyForm threadId={threadId} />
    </section>
  );
}
