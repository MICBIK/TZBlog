"use client"

import { format } from "date-fns"
import { useState } from "react"

import type { CommentNode } from "@/lib/services/comments"
import { CommentForm } from "./CommentForm"

/**
 * <CommentList> — D3 评论列表（含 1 层 reply 嵌套）。
 *
 * - 顶层评论按数组顺序展示
 * - 每条顶层评论下方挂「回复」按钮 → 点击展开 inline `<CommentForm parentId>`
 * - reply 评论嵌套在父下方，data-comment-reply 容器有 pl-8 缩进；自身不再有「回复」按钮
 *
 * Server 端 `listApprovedComments` 已保证 reply.replies = []，此处无需递归。
 */

interface CommentListProps {
  comments: CommentNode[]
  slug: string
}

export function CommentList({ comments, slug }: CommentListProps) {
  const [openReplyFor, setOpenReplyFor] = useState<string | null>(null)

  return (
    <ul className="space-y-6">
      {comments.map((c) => {
        const isOpen = openReplyFor === c.id
        return (
          <li key={c.id} className="space-y-3">
            <CommentEntry comment={c} />
            {c.replies.length > 0 && (
              <ul className="space-y-3">
                {c.replies.map((r) => (
                  <li
                    key={r.id}
                    data-comment-reply
                    className="pl-8 border-l border-border"
                  >
                    <CommentEntry comment={r} />
                  </li>
                ))}
              </ul>
            )}
            <div>
              <button
                type="button"
                onClick={() => setOpenReplyFor(isOpen ? null : c.id)}
                className="font-mono text-xs text-muted-fg transition hover:text-fg"
              >
                {isOpen ? "取消回复" : "回复"}
              </button>
            </div>
            {isOpen && (
              <div className="pl-8">
                <CommentForm
                  slug={slug}
                  parentId={c.id}
                  onSuccess={() => setOpenReplyFor(null)}
                />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function CommentEntry({ comment }: { comment: CommentNode }) {
  return (
    <article className="space-y-1">
      <header className="flex items-baseline gap-2 font-mono text-xs text-muted-fg">
        {comment.authorWebsite ? (
          <a
            href={comment.authorWebsite}
            target="_blank"
            rel="noreferrer noopener"
            className="text-fg hover:underline"
          >
            {comment.authorName}
          </a>
        ) : (
          <span className="text-fg">{comment.authorName}</span>
        )}
        <time>
          {format(new Date(comment.createdAt), "yyyy-MM-dd HH:mm")}
        </time>
      </header>
      <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
    </article>
  )
}
