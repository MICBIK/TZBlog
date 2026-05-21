import type { MetadataRoute } from "next"

import { DEFAULT_LOCALE } from "@/lib/i18n"
import { absoluteUrl } from "@/lib/site-meta"
import { listColumnsForLocale } from "@/lib/services/columns"
import { listAllPublishedSlugs } from "@/lib/services/posts"

export const revalidate = 600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, columns] = await Promise.all([
    listAllPublishedSlugs(),
    listColumnsForLocale(DEFAULT_LOCALE),
  ])

  return [
    { url: absoluteUrl("/") },
    { url: absoluteUrl("/posts") },
    { url: absoluteUrl("/about") },
    ...posts.map((post) => ({
      url: absoluteUrl(`/posts/${post.slug}`),
      lastModified: post.updatedAt,
    })),
    ...columns.map((column) => ({
      url: absoluteUrl(`/columns/${column.slug}`),
    })),
  ]
}
