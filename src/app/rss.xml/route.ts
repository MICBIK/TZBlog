import { DEFAULT_LOCALE } from "@/lib/i18n"
import { SITE_META, absoluteUrl } from "@/lib/site-meta"
import { listPosts } from "@/lib/services/posts"

export const revalidate = 600

export async function GET(): Promise<Response> {
  const posts = await listPosts(
    { page: 1, pageSize: 20, status: "PUBLISHED" },
    DEFAULT_LOCALE,
  )
  const baseUrl = SITE_META.baseUrl.replace(/\/+$/, "")
  const items = posts.items.map((post) => {
    const postUrl = absoluteUrl(`/posts/${post.slug}`)
    const pubDate = (post.publishedAt ?? post.updatedAt).toUTCString()

    return [
      "    <item>",
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(postUrl)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>`,
      `      <pubDate>${escapeXml(pubDate)}</pubDate>`,
      `      <description>${escapeXml(post.excerpt ?? "")}</description>`,
      "    </item>",
    ].join("\n")
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(SITE_META.name)}</title>`,
    `    <link>${escapeXml(baseUrl)}</link>`,
    `    <description>${escapeXml(SITE_META.description)}</description>`,
    `    <atom:link href="${escapeXml(absoluteUrl("/rss.xml"))}" rel="self" type="application/rss+xml" />`,
    `    <lastBuildDate>${escapeXml(new Date().toUTCString())}</lastBuildDate>`,
    ...items,
    "  </channel>",
    "</rss>",
  ].join("\n")

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  })
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}
