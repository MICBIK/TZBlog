import type { CommentStatus } from "@prisma/client"

/**
 * Comment service — D3 评论流（PENDING 默认 + 1 层 reply）。
 *
 * Stub: TDD RED 阶段，签名占位让 typecheck 通过；运行时 throw。
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
  throw new Error(`not implemented: createComment(${input.slug})`)
}

export async function listApprovedComments(
  postId: string,
): Promise<CommentNode[]> {
  throw new Error(`not implemented: listApprovedComments(${postId})`)
}
