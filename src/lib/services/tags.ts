import type { Tag } from "@prisma/client"

import { db } from "@/lib/db"
import type { TagFilterInput } from "@/lib/schemas/tag"

/**
 * Tag service — owns reads + slug-based upserts used by the post pipeline.
 *
 * Tags are intentionally locale-free for MVP (per systemPatterns §7 only the
 * `*Translation` *content* tables are split by locale). The slug is the
 * canonical identifier so the post API can accept human-readable arrays.
 */

export type TagListItem = {
  id: string
  slug: string
  name: string
  postCount: number
}

/**
 * All tags ordered by name asc. When `filter.q` is provided, names are
 * matched case-insensitively (substring). `postCount` aggregates the join
 * table so the admin list can show usage at a glance.
 */
export async function listTags(
  filter: TagFilterInput = {},
): Promise<TagListItem[]> {
  const rows = await db.tag.findMany({
    where: filter.q
      ? { name: { contains: filter.q, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { entries: true } },
    },
  })

  return rows.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    postCount: t._count.entries,
  }))
}

/**
 * Idempotent upsert by slug. Used by `createPost` / `updatePost` to turn
 * the API's `tags: string[]` (slugs) into concrete `Tag` rows so the join
 * table can connect by id.
 *
 * - If `name` is omitted we fall back to the slug, matching the convention
 *   used elsewhere in the admin UI for first-time tag creation.
 * - Existing tags are left untouched (no name overwrite); editing display
 *   names is a dedicated admin action, not a side-effect of authoring posts.
 */
export async function upsertTagsBySlug(
  items: Array<{ slug: string; name?: string }>,
): Promise<Array<Pick<Tag, "id" | "slug" | "name">>> {
  if (items.length === 0) return []

  // De-dupe by slug so a typo'd duplicate in the request doesn't double-write.
  const bySlug = new Map<string, { slug: string; name?: string }>()
  for (const item of items) {
    if (!bySlug.has(item.slug)) bySlug.set(item.slug, item)
  }

  const results: Array<Pick<Tag, "id" | "slug" | "name">> = []
  for (const item of bySlug.values()) {
    const tag = await db.tag.upsert({
      where: { slug: item.slug },
      create: { slug: item.slug, name: item.name?.trim() || item.slug },
      update: {}, // never overwrite name on an authoring path
      select: { id: true, slug: true, name: true },
    })
    results.push(tag)
  }
  return results
}
