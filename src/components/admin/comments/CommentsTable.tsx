"use client"

import { format } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import type { CommentStatus } from "@prisma/client"

import type { AdminCommentListItem } from "@/lib/services/comments"

/**
 * <CommentsTable> — admin 评论审核表格。
 *
 * 行内动作 PATCH（乐观更新 status + 失败回滚）：通过 / 垃圾 / 拒绝
 * 行内 DELETE（确认后真删，含 cascade replies）：删除
 * 多选 + BulkActions（顶部条）：批量通过 / 标垃圾 / 拒绝
 *
 * BulkActions ids 顺序按 items 顺序，与 selected Set 无关，便于测试可预测断言。
 */

interface CommentsTableProps {
  initialItems: AdminCommentListItem[]
  total: number
  page: number
  pageSize: number
}

const STATUS_LABEL: Record<CommentStatus, string> = {
  PENDING: "待审",
  APPROVED: "已通过",
  SPAM: "垃圾",
  REJECTED: "已拒",
}

const STATUS_BADGE_CLS: Record<CommentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  SPAM: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
  REJECTED: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
}

export function CommentsTable({
  initialItems,
  total,
  page,
  pageSize,
}: CommentsTableProps) {
  const [items, setItems] = useState<AdminCommentListItem[]>(initialItems)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<Set<string>>(new Set())

  function toggleSelect(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function patchStatus(
    id: string,
    status: CommentStatus,
  ): Promise<void> {
    const original = items.find((i) => i.id === id)
    if (!original) return

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i)),
    )
    setPending((prev) => new Set(prev).add(id))

    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success(`已${STATUS_LABEL[status]}`)
    } catch (err) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? original : i)),
      )
      toast.error("操作失败", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setPending((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  async function handleDelete(item: AdminCommentListItem): Promise<void> {
    const ok = window.confirm(
      `确认删除「${item.authorName}」的评论？该操作不可恢复。`,
    )
    if (!ok) return

    setPending((prev) => new Set(prev).add(item.id))
    try {
      const res = await fetch(`/api/admin/comments/${item.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      toast.success("已删除")
    } catch (err) {
      toast.error("删除失败", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setPending((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  async function bulkUpdate(status: CommentStatus): Promise<void> {
    const ids = items.filter((i) => selected.has(i.id)).map((i) => i.id)
    if (ids.length === 0) return

    try {
      const res = await fetch("/api/admin/comments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setItems((prev) =>
        prev.map((i) => (ids.includes(i.id) ? { ...i, status } : i)),
      )
      setSelected(new Set())
      toast.success(`已批量${STATUS_LABEL[status]} ${ids.length} 条`)
    } catch (err) {
      toast.error("批量操作失败", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <div
          data-testid="bulk-actions"
          className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-2 text-sm"
        >
          <span className="font-mono">已选 {selected.size} 条</span>
          <button
            type="button"
            onClick={() => bulkUpdate("APPROVED")}
            className="rounded border border-border px-3 py-1 hover:bg-muted"
          >
            批量通过
          </button>
          <button
            type="button"
            onClick={() => bulkUpdate("SPAM")}
            className="rounded border border-border px-3 py-1 hover:bg-muted"
          >
            批量标垃圾
          </button>
          <button
            type="button"
            onClick={() => bulkUpdate("REJECTED")}
            className="rounded border border-border px-3 py-1 hover:bg-muted"
          >
            批量拒绝
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-fg">
              <th className="w-10 px-3 py-2"></th>
              <th className="px-3 py-2">作者</th>
              <th className="px-3 py-2">内容</th>
              <th className="px-3 py-2">文章</th>
              <th className="px-3 py-2">时间</th>
              <th className="px-3 py-2">状态</th>
              <th className="px-3 py-2 text-right">动作</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-fg">
                  暂无评论
                </td>
              </tr>
            )}
            {items.map((item) => {
              const isPending = pending.has(item.id)
              const isSelected = selected.has(item.id)
              return (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`select-row-${item.id}`}
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{item.authorName}</div>
                    <div className="text-xs text-muted-fg">{item.authorEmail}</div>
                  </td>
                  <td className="px-3 py-3 max-w-md">
                    <p className="line-clamp-2 whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <a
                      href={`/posts/${item.post.slug}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-xs hover:underline"
                    >
                      {item.post.title}
                    </a>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-fg">
                    {format(new Date(item.createdAt), "MM-dd HH:mm")}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${STATUS_BADGE_CLS[item.status]}`}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => patchStatus(item.id, "APPROVED")}
                        className="rounded border border-border px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-50"
                      >
                        通过
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => patchStatus(item.id, "SPAM")}
                        className="rounded border border-border px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-50"
                      >
                        垃圾
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => patchStatus(item.id, "REJECTED")}
                        className="rounded border border-border px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-50"
                      >
                        拒绝
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(item)}
                        className="rounded border border-border px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between font-mono text-xs text-muted-fg">
        <span>
          共 {total} 条 · 第 {page} 页 / 每页 {pageSize}
        </span>
      </div>
    </div>
  )
}
