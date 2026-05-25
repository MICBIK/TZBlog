import Link from "next/link";

import type { GuestbookThreadSummary } from "@/lib/services/guestbook";

export function GuestbookAdminThreadList({
  threads,
}: {
  threads: GuestbookThreadSummary[];
}) {
  return (
    <section className="rounded-lg border border-border p-6" data-testid="guestbook-admin-list">
      <h2 className="text-xl font-semibold">访客留言线程</h2>
      {threads.length === 0 ? (
        <p className="mt-4 text-sm text-muted-fg">暂无访客留言。</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {threads.map((thread) => (
            <li key={thread.id} className="py-4">
              <Link
                href={`/guestbook/${thread.id}`}
                className="block space-y-1 transition-opacity hover:opacity-80"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-fg">{thread.author.name}</span>
                  <span className="text-xs text-muted-fg">
                    {thread.messageCount} 条消息
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-fg">{thread.body}</p>
                {thread.resolved && (
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-fg">
                    已处理
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
