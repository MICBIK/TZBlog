import { listApprovedComments } from "@/lib/services/comments"

import { CommentForm } from "./CommentForm"
import { CommentList } from "./CommentList"

/**
 * <CommentSection> — D3 评论区（服务端组件）。
 *
 * 内部组合：
 *   - `listApprovedComments(postId)` → 取已审核评论（仅 APPROVED，嵌套 1 层 reply）
 *   - `<CommentList>` 渲染列表（含 reply 按钮 + 嵌入 client form）
 *   - `<CommentForm>` 顶层提交表单（parentId 留空 → 顶层评论）
 *
 * 没有评论时，仍渲染表单与一段「成为第一个评论的人」的引导文案。
 */

interface CommentSectionProps {
  postId: string
  slug: string
}

export async function CommentSection({ postId, slug }: CommentSectionProps) {
  const comments = await listApprovedComments(postId)

  return (
    <section className="space-y-8 border-t border-border pt-10">
      <header className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight">评论</h2>
        <span className="font-mono text-xs text-muted-fg">
          {comments.length === 0
            ? "暂无评论"
            : `${comments.length} 条评论`}
        </span>
      </header>

      {comments.length > 0 ? (
        <CommentList comments={comments} slug={slug} />
      ) : (
        <p className="font-mono text-xs text-muted-fg">
          成为第一个评论的人。
        </p>
      )}

      <div className="space-y-3 border-t border-border pt-8">
        <h3 className="text-sm font-mono text-muted-fg">发表评论</h3>
        <CommentForm slug={slug} />
      </div>
    </section>
  )
}
