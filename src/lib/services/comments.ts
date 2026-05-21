import type { CommentStatus } from "@prisma/client"

import { db } from "@/lib/db"
import { errors } from "@/lib/errors"

/**
 * Comment service — D3 评论流（PENDING 默认 + 1 层 reply）。
 *
 * createComment:
 *   - 验证 post 存在（NOT_FOUND on missing slug）
 *   - 若带 parentId：验证 parent 存在 + parent.parentId === null（深度 ≤ 1）
 *   - 事务内 insert PENDING + Post.commentCount + 1
 *
 * listApprovedComments:
 *   - 仅 APPROVED；顶层按 createdAt asc；reply 嵌套在父下
 *   - depth-2 限制：reply 自身的 replies 永远为空数组
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
