"use client"

import type { CommentNode } from "@/lib/services/comments"

interface CommentListProps {
  comments: CommentNode[]
  slug: string
}

/**
 * <CommentList> — D3 评论列表（含 1 层 reply 嵌套）。
 *
 * Stub: TDD RED 阶段，仅扁平渲染顶层 content。
 */
export function CommentList({ comments, slug }: CommentListProps) {
  return (
    <ul data-stub="true" data-slug={slug}>
      {comments.map((c) => (
        <li key={c.id}>{c.content}</li>
      ))}
    </ul>
  )
}
