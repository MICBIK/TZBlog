import type { GuestbookMessage } from "@/lib/services/guestbook";

export function ThreadView({ messages }: { messages: GuestbookMessage[] }) {
  return (
    <ol className="space-y-4" data-testid="guestbook-thread-view">
      {messages.map((message) => (
        <li
          key={message.id}
          className="rounded-lg border border-border bg-bg p-4"
          data-message-id={message.id}
        >
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-fg">
            <span className="font-medium text-fg">{message.authorName}</span>
            <time dateTime={message.createdAt.toISOString()}>
              {message.createdAt.toLocaleString("zh-CN")}
            </time>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7 text-fg">
            {message.content}
          </p>
        </li>
      ))}
    </ol>
  );
}
