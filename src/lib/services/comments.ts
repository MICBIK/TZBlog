import type { CommentStatus, CommentVisibility, Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { AppError, errors } from "@/lib/errors"
import { DEFAULT_LOCALE } from "@/lib/i18n"

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

export type CreatePrivateThreadCommentInput = {
  entryId: string
  authorUserId: string
  content: string
}

export async function createComment(
  input: CreateCommentInput,
): Promise<{ id: string; status: CommentStatus }> {
  const entry = await db.entry.findFirst({
    where: { slug: input.slug, kind: "ARTICLE" },
    select: { id: true },
  })
  if (!entry) {
    throw errors.notFound(`Entry with slug "${input.slug}" not found`)
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
      entryId: entry.id,
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

export async function createPrivateThreadComment(
  input: CreatePrivateThreadCommentInput,
): Promise<{
  id: string
  entryId: string | null
  authorUserId: string | null
  visibility: CommentVisibility
}> {
  const [entry, author] = await Promise.all([
    db.entry.findFirst({
      where: { id: input.entryId, kind: "GUESTBOOK_THREAD" },
      select: { id: true },
    }),
    db.user.findUnique({
      where: { id: input.authorUserId },
      select: { id: true, email: true, name: true },
    }),
  ])
  if (!entry) {
    throw errors.notFound(`Guestbook thread ${input.entryId} not found`)
  }
  if (!author) {
    throw errors.notFound(`User ${input.authorUserId} not found`)
  }

  return db.comment.create({
    data: {
      entryId: entry.id,
      authorUserId: author.id,
      authorName: author.name ?? author.email,
      authorEmail: author.email,
      content: input.content,
      status: "APPROVED",
      visibility: "PRIVATE_TO_THREAD",
      visitorHash: `user:${author.id}`,
      ipAddress: "authenticated-user",
      userAgent: "guestbook-thread",
    },
    select: {
      id: true,
      entryId: true,
      authorUserId: true,
      visibility: true,
    },
  })
}

export async function listApprovedComments(
  entryId: string,
): Promise<CommentNode[]> {
  const rows = await db.comment.findMany({
    where: { entryId, status: "APPROVED" },
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
  const where: Prisma.CommentWhereInput = {}
  if (filter.status) where.status = filter.status
  if (filter.postId) where.entryId = filter.postId
  if (filter.q && filter.q.trim()) {
    const q = filter.q.trim()
    where.OR = [
      { authorName: { contains: q, mode: "insensitive" } },
      { authorEmail: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ]
  }

  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 20
  const skip = (page - 1) * pageSize

  const [rows, total] = await Promise.all([
    db.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        entry: {
          select: {
            slug: true,
            translations: {
              where: { locale: DEFAULT_LOCALE },
              select: { title: true },
              take: 1,
            },
          },
        },
      },
    }),
    db.comment.count({ where }),
  ])

  const items: AdminCommentListItem[] = rows.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    authorEmail: r.authorEmail,
    authorWebsite: r.authorWebsite,
    content: r.content,
    status: r.status,
    parentId: r.parentId,
    visitorHash: r.visitorHash,
    ipAddress: r.ipAddress,
    reviewedBy: r.reviewedBy,
    reviewedAt: r.reviewedAt,
    createdAt: r.createdAt,
    post: {
      slug: r.entry?.slug ?? "",
      title: r.entry?.translations[0]?.title ?? r.entry?.slug ?? "",
    },
  }))

  return { items, total, page, pageSize }
}

export async function updateCommentStatus(
  id: string,
  status: CommentStatus,
  reviewerId: string,
): Promise<{ id: string; status: CommentStatus }> {
  const current = await db.comment.findUnique({
    where: { id },
    select: { id: true, status: true, entryId: true },
  })
  if (!current) {
    throw errors.notFound(`Comment ${id} not found`)
  }

  const wasApproved = current.status === "APPROVED"
  const willBeApproved = status === "APPROVED"

  let countDelta = 0
  if (!wasApproved && willBeApproved) countDelta = 1
  else if (wasApproved && !willBeApproved) countDelta = -1
  // 同 status 或非 APPROVED 间切换：0（含幂等场景）

  await db.$transaction(async (tx) => {
    await tx.comment.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    })
    if (countDelta !== 0) {
      if (!current.entryId) {
        throw errors.validation(`Comment ${id} is not linked to an entry`)
      }
      await tx.entry.update({
        where: { id: current.entryId },
        data: { commentCount: { increment: countDelta } },
      })
    }
  })

  return { id, status }
}

export async function bulkUpdateCommentStatus(
  ids: string[],
  status: CommentStatus,
  reviewerId: string,
): Promise<{ updated: number }> {
  let updated = 0
  for (const id of ids) {
    try {
      await updateCommentStatus(id, status, reviewerId)
      updated++
    } catch (e) {
      if (e instanceof AppError && e.code === "NOT_FOUND") continue
      throw e
    }
  }
  return { updated }
}

export async function deleteComment(id: string): Promise<void> {
  const current = await db.comment.findUnique({
    where: { id },
    select: { id: true, status: true, entryId: true, parentId: true },
  })
  if (!current) {
    throw errors.notFound(`Comment ${id} not found`)
  }

  // 顶层评论被删时，先收集所有 APPROVED 子 reply 用于计数器调整
  let approvedRepliesCount = 0
  if (current.parentId === null) {
    const replies = await db.comment.findMany({
      where: { parentId: id },
      select: { id: true, status: true },
    })
    approvedRepliesCount = replies.filter((r) => r.status === "APPROVED").length
  }

  const selfDelta = current.status === "APPROVED" ? -1 : 0
  const totalDelta = selfDelta - approvedRepliesCount

  await db.$transaction(async (tx) => {
    if (current.parentId === null) {
      await tx.comment.deleteMany({ where: { parentId: id } })
    }
    await tx.comment.delete({ where: { id } })
    if (totalDelta !== 0) {
      if (!current.entryId) {
        throw errors.validation(`Comment ${id} is not linked to an entry`)
      }
      await tx.entry.update({
        where: { id: current.entryId },
        data: { commentCount: { increment: totalDelta } },
      })
    }
  })
}
