"use client"

interface CommentFormProps {
  slug: string
  parentId?: string
  onSuccess?: () => void
}

/**
 * <CommentForm> — D3 评论提交表单（含 reply mode via parentId）。
 *
 * Stub: TDD RED 阶段，仅占位 UI，不发 fetch。
 */
export function CommentForm({ slug, parentId, onSuccess }: CommentFormProps) {
  return (
    <form data-slug={slug} data-parent-id={parentId ?? ""} data-stub="true">
      <input name="authorName" />
      <input name="authorEmail" />
      <input name="authorWebsite" />
      <textarea name="content" />
      <button type="submit" onClick={() => onSuccess?.()}>
        提交
      </button>
    </form>
  )
}
