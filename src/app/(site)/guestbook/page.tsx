import type { Metadata } from "next"

import { getChannelPageBySlug } from "@/lib/services/channels"
import { DEFAULT_LOCALE, getCurrentLocale, type Locale } from "@/lib/i18n"

export const metadata: Metadata = {
  title: "留言板 — TZBlog",
  description: "给 HaiDen 留一条私密消息。",
}

type GuestbookChannel = NonNullable<
  Awaited<ReturnType<typeof getChannelPageBySlug>>
>

function pickTranslation(
  channel: GuestbookChannel,
  locale: Locale,
): GuestbookChannel["translations"][number] | undefined {
  return (
    channel.translations.find((row) => row.locale === locale) ??
    channel.translations.find((row) => row.locale === DEFAULT_LOCALE) ??
    channel.translations[0]
  )
}

export default async function GuestbookPage() {
  const channel = await getChannelPageBySlug("guestbook")
  const locale = getCurrentLocale()
  const tr = channel ? pickTranslation(channel, locale) : undefined

  const title = tr?.name ?? "留言板"
  const description =
    tr?.description ?? "留下邮箱后通过 magic link 登录，再发送私密留言。"

  return (
    <main className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-normal text-muted-fg">
          private guestbook
        </p>
        <h1 className="text-4xl font-semibold md:text-5xl">
          {title}
        </h1>
        <p className="text-base text-muted-fg">{description}</p>
      </header>

      <section
        data-guestbook-auth="magic-link"
        className="rounded-lg border border-border p-6"
      >
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">
            邮箱 magic link 登录
          </h2>
          <p className="text-sm text-muted-fg">
            输入邮箱后发送登录链接。开发环境未配置邮件服务时，链接会输出到服务端日志。
          </p>
        </div>

        <form className="mt-6 flex flex-col gap-3" action="/api/auth/signin/email" method="post">
          <label htmlFor="guestbook-email" className="text-sm font-medium">
            邮箱
          </label>
          <input
            id="guestbook-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-11 rounded-md border border-border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="you@example.com"
          />
          <button
            type="submit"
            className="h-11 rounded-md bg-accent px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90"
          >
            发送登录链接
          </button>
        </form>
      </section>
    </main>
  )
}
