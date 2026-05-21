import type { MetadataRoute } from "next"

import { DEFAULT_LOCALE } from "@/lib/i18n"
import { absoluteUrl } from "@/lib/site-meta"
import { listColumns } from "@/lib/services/columns"
import { listPosts } from "@/lib/services/posts"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, columns] = await Promise.all([
    listPosts({ page: 1, pageSize: 1000, status: "PUBLISHED" }, DEFAULT_LOCALE),
    listColumns(),
  ])

  return [
    { url: absoluteUrl("/") },
    { url: absoluteUrl("/posts") },
    { url: absoluteUrl("/about") },
    ...posts.items.map((post) => ({
      url: absoluteUrl(`/posts/${post.slug}`),
      lastModified: post.updatedAt,
    })),
    ...columns.map((column) => ({
      url: absoluteUrl(`/columns/${column.slug}`),
    })),
  ]
}
