"use client"

interface LikeButtonProps {
  slug: string
  initialLikeCount: number
}

/**
 * <LikeButton> — 文章详情页点赞按钮（D3）。
 *
 * Stub: TDD RED 阶段，仅渲染初态，未挂 fetch 与点击逻辑。
 */
export function LikeButton({ slug, initialLikeCount }: LikeButtonProps) {
  return (
    <button
      type="button"
      aria-pressed="false"
      data-slug={slug}
      data-stub="true"
    >
      <span>{initialLikeCount}</span>
    </button>
  )
}
