/**
 * Single-locale sitemap. Multi-locale alternates pending V3 (`i18n-locale-routing-v3` SDD).
 */
import type { MetadataRoute } from "next"

import { DEFAULT_LOCALE } from "@/lib/i18n"
import { absoluteUrl } from "@/lib/site-meta"
import { listColumnsForLocale } from "@/lib/services/columns"
import { listAllPublishedSlugs } from "@/lib/services/posts"
import { listAllTagsWithCount } from "@/lib/services/tags-public"

export const revalidate = 600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, columns, tags] = await Promise.all([
    listAllPublishedSlugs(),
    listColumnsForLocale(DEFAULT_LOCALE),
    listAllTagsWithCount(DEFAULT_LOCALE),
  ])

  return [
    { url: absoluteUrl("/") },
    { url: absoluteUrl("/posts") },
    { url: absoluteUrl("/about") },
    { url: absoluteUrl("/tags") },
    ...posts.map((post) => ({
      url: absoluteUrl(`/posts/${post.slug}`),
      lastModified: post.updatedAt,
    })),
    ...columns.map((column) => ({
      url: absoluteUrl(`/columns/${column.slug}`),
    })),
    ...tags.map((tag) => ({
      url: absoluteUrl(`/tags/${tag.slug}`),
    })),
  ]
}
