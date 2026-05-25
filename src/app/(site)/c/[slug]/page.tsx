import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ChannelLayoutRenderer } from "@/components/channel-layouts/ChannelLayoutRenderer"
import type { ChannelLayoutEntry } from "@/components/channel-layouts/types"
import { BootSequence } from "@/components/terminal/BootSequence"
import { TerminalShell } from "@/components/terminal/TerminalShell"
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

function toChannelLayoutEntries(
  channel: ChannelPageData,
  locale: Locale,
): ChannelLayoutEntry[] {
  return channel.entries.map((entry) => {
    const entryTr = pickEntryTranslation(entry, locale)
    return {
      id: entry.id,
      slug: entry.slug,
      kind: entry.kind,
      publishedAt: entry.publishedAt,
      title: entryTr?.title ?? entry.slug,
      excerpt: entryTr?.excerpt,
      metadata: entry.metadata,
      tags: entry.tags.map((row) => row.tag.slug),
    }
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const channel = await getChannelPageBySlug(slug)
  if (!channel) return {}
  const tr = pickChannelTranslation(channel, getCurrentLocale())
  const title = tr?.name ?? channel.slug
  const description = tr?.description ?? undefined
  return {
    title: `${title} — TZBlog`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
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
  const isStream = channel.kind === "STREAM"

  const content = (
    <>
      <header className="space-y-4">
        <Link
          href="/"
          className="inline-block font-mono text-xs text-muted-fg transition hover:text-fg terminal-link"
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

      <ChannelLayoutRenderer
        layout={channel.layout}
        channelSlug={channel.slug}
        entries={toChannelLayoutEntries(channel, locale)}
      />
    </>
  )

  if (isStream) {
    return (
      <TerminalShell slug={channel.slug}>
        <BootSequence channelSlug={channel.slug} />
        <article
          data-channel-layout={channel.layout}
          className="mx-auto max-w-6xl space-y-10"
        >
          {content}
        </article>
      </TerminalShell>
    )
  }

  return (
    <article
      data-channel-layout={channel.layout}
      className="mx-auto max-w-6xl space-y-10"
    >
      {content}
    </article>
  )
}
