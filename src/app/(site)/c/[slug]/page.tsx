import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { format } from "date-fns"

import {
  getChannelPageBySlug,
  type ChannelPageData,
} from "@/lib/services/channels"
import { DEFAULT_LOCALE, getCurrentLocale, type Locale } from "@/lib/i18n"

type Props = { params: Promise<{ slug: string }> }

function pickChannelTranslation(
  channel: ChannelPageData,
  locale: Locale,
): ChannelPageData["translations"][number] | undefined {
  return (
    channel.translations.find((row) => row.locale === locale) ??
    channel.translations.find((row) => row.locale === DEFAULT_LOCALE) ??
    channel.translations[0]
  )
}

function pickEntryTranslation(
  entry: ChannelPageData["entries"][number],
  locale: Locale,
): ChannelPageData["entries"][number]["translations"][number] | undefined {
  return (
    entry.translations.find((row) => row.locale === locale) ??
    entry.translations.find((row) => row.locale === DEFAULT_LOCALE) ??
    entry.translations[0]
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const channel = await getChannelPageBySlug(slug)
  if (!channel) return {}
  const tr = pickChannelTranslation(channel, getCurrentLocale())
  return {
    title: `${tr?.name ?? channel.slug} — TZBlog`,
    description: tr?.description ?? undefined,
  }
}

export default async function ChannelDetailPage({ params }: Props) {
  const { slug } = await params
  const channel = await getChannelPageBySlug(slug)
  if (!channel) notFound()

  const locale = getCurrentLocale()
  const tr = pickChannelTranslation(channel, locale)
  const name = tr?.name ?? channel.slug
  const description = tr?.description
  const tagline = tr?.tagline

  return (
    <article
      data-channel-layout={channel.layout}
      className="mx-auto max-w-6xl space-y-10"
    >
      <header className="space-y-4">
        <Link
          href="/"
          className="inline-block font-mono text-xs text-muted-fg transition hover:text-fg"
        >
          ← 首页
        </Link>
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-normal text-muted-fg">
            {channel.kind} / {channel.layout}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            {name}
          </h1>
          {description ? (
            <p className="max-w-2xl text-base text-muted-fg">
              {description}
            </p>
          ) : null}
          {tagline ? (
            <p className="font-mono text-sm text-fg">{tagline}</p>
          ) : null}
        </div>
      </header>

      {channel.entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-fg">
          这个频道还没有发布内容。
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border font-mono text-sm">
          {channel.entries.map((entry) => {
            const entryTr = pickEntryTranslation(entry, locale)
            const href =
              entry.kind === "ARTICLE" || entry.kind === "REVIEW"
                ? `/posts/${entry.slug}`
                : `/c/${channel.slug}#${entry.slug}`

            return (
              <li
                id={entry.slug}
                key={entry.id}
                className="grid gap-3 py-5 md:grid-cols-[11rem_minmax(0,1fr)]"
              >
                <div className="text-xs text-muted-fg">
                  {entry.publishedAt ? (
                    <time>{format(entry.publishedAt, "yyyy-MM-dd")}</time>
                  ) : null}
                  <div className="mt-1">{entry.kind}</div>
                </div>
                <Link href={href} className="group min-w-0">
                  <h2 className="text-base font-semibold text-fg group-hover:underline">
                    {entryTr?.title ?? entry.slug}
                  </h2>
                  {entryTr?.excerpt ? (
                    <p className="mt-2 text-sm text-muted-fg">
                      {entryTr.excerpt}
                    </p>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}
