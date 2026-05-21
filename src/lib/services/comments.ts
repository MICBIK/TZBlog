import type { CommentStatus } from "@prisma/client"

import { db } from "@/lib/db"
import { errors } from "@/lib/errors"

/**
 * Comment service — D3 评论流（PENDING 默认 + 1 层 reply）+ C 评论审核（admin 端 mutation/list）。
 *
 * D3:
 *   createComment / listApprovedComments
 *
 * C (admin-comments-review):
 *   listCommentsForAdmin / updateCommentStatus / bulkUpdateCommentStatus / deleteComment
 *
 * 计数器规则（R6 修正 D3 R5）：
 *   - createComment 不再 +1（PENDING 不计）
 *   - updateCommentStatus：→ APPROVED +1；APPROVED → 其他 -1；其他间不变
 *   - deleteComment：原 status === APPROVED 时 -1；含 cascade replies 的同样累计
 */

export type CreateCommentInput = {
  slug: string
  authorName: string
  authorEmail: string
  authorWebsite?: string
  content: string
  visitorHash: string
  ipAddress: string
  userAgent: string
  parentId?: string
}

export type CommentNode = {
  id: string
  authorName: string
  authorWebsite: string | null
  content: string
  createdAt: Date
  replies: CommentNode[]
}

export async function createComment(
  input: CreateCommentInput,
): Promise<{ id: string; status: CommentStatus }> {
  const post = await db.post.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  })
  if (!post) {
    throw errors.notFound(`Post with slug "${input.slug}" not found`)
  }

  if (input.parentId) {
    const parent = await db.comment.findUnique({
      where: { id: input.parentId },
      select: { id: true, parentId: true },
    })
    if (!parent) {
      throw errors.notFound(`Parent comment "${input.parentId}" not found`)
    }
    if (parent.parentId !== null) {
      throw errors.validation(
        "Cannot reply to a reply (max reply depth is 1)",
      )
    }
  }

  const created = await db.comment.create({
    data: {
      postId: post.id,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      authorWebsite: input.authorWebsite ?? null,
      content: input.content,
      status: "PENDING",
      visitorHash: input.visitorHash,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      parentId: input.parentId ?? null,
    },
    select: { id: true, status: true },
  })

  return created
}

export async function listApprovedComments(
  postId: string,
): Promise<CommentNode[]> {
  const rows = await db.comment.findMany({
    where: { postId, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      authorName: true,
      authorWebsite: true,
      content: true,
      createdAt: true,
      parentId: true,
    },
  })

  const tops: CommentNode[] = []
  const byTopId = new Map<string, CommentNode>()

  for (const row of rows) {
    if (row.parentId === null) {
      const node: CommentNode = {
        id: row.id,
        authorName: row.authorName,
        authorWebsite: row.authorWebsite,
        content: row.content,
        createdAt: row.createdAt,
        replies: [],
      }
      tops.push(node)
      byTopId.set(row.id, node)
    }
  }

  for (const row of rows) {
    if (row.parentId === null) continue
    const parent = byTopId.get(row.parentId)
    if (!parent) continue // parent 非 APPROVED：静默丢弃该 reply
    parent.replies.push({
      id: row.id,
      authorName: row.authorName,
      authorWebsite: row.authorWebsite,
      content: row.content,
      createdAt: row.createdAt,
      replies: [],
    })
  }

  return tops
}

// ============================================================
// C epic stubs — TDD RED 阶段占位，GREEN 阶段填充
// ============================================================

export type AdminCommentListItem = {
  id: string
  authorName: string
  authorEmail: string
  authorWebsite: string | null
  content: string
  status: CommentStatus
  parentId: string | null
  visitorHash: string
  ipAddress: string
  reviewedBy: string | null
  reviewedAt: Date | null
  createdAt: Date
  post: { slug: string; title: string }
}

export type CommentAdminFilter = {
  status?: CommentStatus
  postId?: string
  q?: string
  page?: number
  pageSize?: number
}

export async function listCommentsForAdmin(
  filter: CommentAdminFilter,
): Promise<{
  items: AdminCommentListItem[]
  total: number
  page: number
  pageSize: number
}> {
  throw new Error(`not implemented: listCommentsForAdmin(${JSON.stringify(filter)})`)
}

export async function updateCommentStatus(
  id: string,
  status: CommentStatus,
  reviewerId: string,
): Promise<{ id: string; status: CommentStatus }> {
  throw new Error(
    `not implemented: updateCommentStatus(${id}, ${status}, ${reviewerId})`,
  )
}

export async function bulkUpdateCommentStatus(
  ids: string[],
  status: CommentStatus,
  reviewerId: string,
): Promise<{ updated: number }> {
  throw new Error(
    `not implemented: bulkUpdateCommentStatus([${ids.length}], ${status}, ${reviewerId})`,
  )
}

export async function deleteComment(id: string): Promise<void> {
  throw new Error(`not implemented: deleteComment(${id})`)
}
