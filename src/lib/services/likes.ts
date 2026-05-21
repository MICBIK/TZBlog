import { db } from "@/lib/db"
import { errors } from "@/lib/errors"

/**
 * Likes service — 永久 unique 一次性点赞（D3）。
 * 与 `incrementPostView` 同构：
 *   - 事务内 `PostLike.create` + `Post.likeCount + 1`
 *   - 唯一约束 `@@unique([postId, visitorHash])` 命中 P2002 时当 idempotent 处理：不增计数器、返回当前 likeCount
 */

export async function addLike(
  slug: string,
  visitorHash: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const post = await db.post.findUnique({
    where: { slug },
    select: { id: true, likeCount: true },
  })
  if (!post) {
    throw errors.notFound(`Post with slug "${slug}" not found`)
  }

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.postLike.create({
        data: { postId: post.id, visitorHash },
      })
      const updated = await tx.post.update({
        where: { id: post.id },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      })
      return updated.likeCount
    })
    return { liked: true, likeCount: result }
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { liked: true, likeCount: post.likeCount }
    }
    throw e
  }
}

export async function hasLikedBy(
  slug: string,
  visitorHash: string,
): Promise<boolean> {
  const row = await db.postLike.findFirst({
    where: { post: { slug }, visitorHash },
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
