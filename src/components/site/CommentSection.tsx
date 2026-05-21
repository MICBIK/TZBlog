/**
 * <CommentSection> — D3 评论区（服务端组件）。
 *
 * Stub: TDD RED 阶段，仅占位 section；GREEN 阶段调 listApprovedComments
 * 并嵌入 CommentList + 顶层 CommentForm。
 */

interface CommentSectionProps {
  postId: string
  slug: string
}

export async function CommentSection({ postId, slug }: CommentSectionProps) {
  return (
    <section
      data-stub-section="true"
      data-post-id={postId}
      data-slug={slug}
    />
  )
}
