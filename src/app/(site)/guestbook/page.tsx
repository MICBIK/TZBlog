import type { Metadata } from "next";

import { GuestbookAdminThreadList } from "@/components/guestbook/GuestbookAdminThreadList";
import { GuestbookAuthPrompt } from "@/components/guestbook/GuestbookAuthPrompt";
import { GuestbookStartForm } from "@/components/guestbook/GuestbookStartForm";
import { GuestbookVisitorThread } from "@/components/guestbook/GuestbookVisitorThread";
import { auth } from "@/lib/auth";
import { getChannelPageBySlug } from "@/lib/services/channels";
import {
  buildGuestbookMessages,
  findVisitorThread,
  listGuestbookThreadsForAdmin,
} from "@/lib/services/guestbook";
import { DEFAULT_LOCALE, getCurrentLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "留言板 — TZBlog",
  description: "给 HaiDen 留一条私密消息。",
};

type GuestbookChannel = NonNullable<
  Awaited<ReturnType<typeof getChannelPageBySlug>>
>;

function pickTranslation(
  channel: GuestbookChannel,
  locale: Locale,
): GuestbookChannel["translations"][number] | undefined {
  return (
    channel.translations.find((row) => row.locale === locale) ??
    channel.translations.find((row) => row.locale === DEFAULT_LOCALE) ??
    channel.translations[0]
  );
}

export default async function GuestbookPage() {
  const session = await auth();
  const channel = await getChannelPageBySlug("guestbook");
  const locale = getCurrentLocale();
  const tr = channel ? pickTranslation(channel, locale) : undefined;

  const title = tr?.name ?? "留言板";
  const description =
    tr?.description ?? "留下邮箱后通过 magic link 登录，再发送私密留言。";

  let body = <GuestbookAuthPrompt />;

  if (session?.user?.role === "ADMIN") {
    body = (
      <GuestbookAdminThreadList
        threads={await listGuestbookThreadsForAdmin()}
      />
    );
  } else if (session?.user) {
    const thread = await findVisitorThread(session.user.id);
    body = thread ? (
      <GuestbookVisitorThread
        threadId={thread.id}
        messages={buildGuestbookMessages(thread)}
      />
    ) : (
      <div className="space-y-6">
        <GuestbookStartForm />
        <p className="text-sm text-muted-fg" data-testid="guestbook-empty-state">
          暂无历史留言。
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-normal text-muted-fg">
          private guestbook
        </p>
        <h1 className="text-4xl font-semibold md:text-5xl">{title}</h1>
        <p className="text-base text-muted-fg">{description}</p>
      </header>
      {body}
    </main>
  );
}
