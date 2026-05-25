import { db } from "@/lib/db"
import { errors } from "@/lib/errors"

/**
 * Likes service — 永久 unique 一次性点赞（D3）。
 * 与 `incrementArticleView` 同构：
 *   - 事务内 `EntryLike.create` + `Entry.likeCount + 1`
 *   - 唯一约束 `@@unique([entryId, visitorHash])` 命中 P2002 时当 idempotent 处理：不增计数器、返回当前 likeCount
 */

export async function addLike(
  slug: string,
  visitorHash: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const entry = await db.entry.findFirst({
    where: { slug, kind: "ARTICLE" },
    select: { id: true, likeCount: true },
  })
  if (!entry) {
    throw errors.notFound(`Entry with slug "${slug}" not found`)
  }

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.entryLike.create({
        data: { entryId: entry.id, visitorHash },
      })
      const updated = await tx.entry.update({
        where: { id: entry.id },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      })
      return updated.likeCount
    })
    return { liked: true, likeCount: result }
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { liked: true, likeCount: entry.likeCount }
    }
    throw e
  }
}

export async function hasLikedBy(
  slug: string,
  visitorHash: string,
): Promise<boolean> {
  const row = await db.entryLike.findFirst({
    where: { entry: { slug, kind: "ARTICLE" }, visitorHash },
    select: { id: true },
  })
  return row !== null
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === "P2002"
  )
}
