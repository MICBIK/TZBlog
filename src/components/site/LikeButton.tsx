"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

interface LikeButtonProps {
  slug: string
  initialLikeCount: number
}

/**
 * <LikeButton> — 文章详情页点赞按钮（D3）。
 *
 * 行为（SPEC-D3-L-8）：
 *   - mount: GET `/api/posts/[slug]/like` 拉访客当前 liked + likeCount，UI 同步
 *   - click: 乐观 +1 + aria-pressed=true + disabled；POST → 成功保留 / 失败回滚 + toast.error
 *
 * 已点过（liked === true）的按钮始终 disabled —— 永久 unique 一次性点赞，
 * 服务端 P2002 也会被 `addLike` 转 idempotent，前端不需要再发 unlike 请求。
 */
export function LikeButton({ slug, initialLikeCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialLikeCount)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        const res = await fetch(
          `/api/posts/${encodeURIComponent(slug)}/like`,
          { method: "GET" },
        )
        if (!res.ok || !mounted) return
        const body = (await res.json()) as {
          data: { liked: boolean; likeCount: number }
        }
        if (!mounted) return
        setLiked(body.data.liked)
        setCount(body.data.likeCount)
      } catch {
        // 初态拉取失败：静默保留 initialLikeCount 与 liked=false
      }
    })()
    return () => {
      mounted = false
    }
  }, [slug])

  async function handleClick(): Promise<void> {
    if (liked || submitting) return
    const prevLiked = liked
    const prevCount = count
    setLiked(true)
    setCount(prevCount + 1)
    setSubmitting(true)
    try {
      const res = await fetch(
        `/api/posts/${encodeURIComponent(slug)}/like`,
        { method: "POST" },
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as {
        data: { liked: boolean; likeCount: number }
      }
      setLiked(body.data.liked)
      setCount(body.data.likeCount)
    } catch {
      setLiked(prevLiked)
      setCount(prevCount)
      toast.error("点赞失败，请稍后再试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={liked || submitting}
      aria-pressed={liked}
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-fg transition hover:text-fg focus-visible:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg aria-pressed:border-fg aria-pressed:text-fg disabled:cursor-not-allowed"
    >
      <span aria-hidden>♥</span>
      <span>{count}</span>
    </button>
  )
}
