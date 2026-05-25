import { ImageResponse } from "next/og"
import { notFound } from "next/navigation"

import { DEFAULT_LOCALE } from "@/lib/i18n"
import { SITE_META } from "@/lib/site-meta"
import { getArticleBySlug, type ArticleWithRelations } from "@/lib/services/articles"

type Props = {
  params: Promise<{ slug: string }>
}

export const size = {
  width: 1200,
  height: 630,
} as const

export const contentType = "image/png"

export default async function Image({ params }: Props): Promise<Response> {
  const { slug } = await params
  const post = await getArticleBySlug(slug)
  if (!post || post.status !== "PUBLISHED") notFound()

  const tr = pickPostTranslation(post)
  if (!tr) notFound()

  const columnLabel = post.channel
    ? (pickChannelName(post.channel) ?? post.channel.slug)
    : "Writings"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#ffffff",
          padding: 60,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 36,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              letterSpacing: 0,
              color: "#888888",
            }}
          >
            TZBLOG
          </div>
          <div
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: 0,
              maxWidth: 980,
            }}
          >
            {tr.title}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#888888",
            }}
          >
            {columnLabel}
          </div>
        </div>
        <div
          style={{
            alignSelf: "flex-end",
            fontSize: 20,
            color: "#888888",
          }}
        >
          {SITE_META.author}
        </div>
      </div>
    ),
    size,
  )
}

function pickPostTranslation(
  post: ArticleWithRelations,
): ArticleWithRelations["translations"][number] | undefined {
  return (
    post.translations.find((t) => t.locale === DEFAULT_LOCALE) ??
    post.translations[0]
  )
}

function pickChannelName(
  channel: NonNullable<ArticleWithRelations["channel"]>,
): string | null {
  return (
    channel.translations.find((t) => t.locale === DEFAULT_LOCALE)?.name ??
    channel.translations[0]?.name ??
    null
  )
}
