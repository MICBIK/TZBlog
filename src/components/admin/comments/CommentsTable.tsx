"use client"

import type { AdminCommentListItem } from "@/lib/services/comments"

interface CommentsTableProps {
  initialItems: AdminCommentListItem[]
  total: number
  page: number
  pageSize: number
}

/**
 * <CommentsTable> — admin 评论审核表格（含多选 + 批量动作 + 行内审核动作）。
 *
 * Stub: TDD RED 阶段，仅扁平渲染。
 */
export function CommentsTable({ initialItems, total, page, pageSize }: CommentsTableProps) {
  return (
    <div
      data-stub-table="true"
      data-total={String(total)}
      data-page={String(page)}
      data-page-size={String(pageSize)}
    >
      {initialItems.map((item) => (
        <div key={item.id} data-comment-id={item.id}>
          <span>{item.authorName}</span>
          <span>{item.content}</span>
        </div>
      ))}
    </div>
  )
}
