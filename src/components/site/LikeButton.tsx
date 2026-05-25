"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

interface LikeButtonProps {
  slug?: string
  entryId?: string
  initialLikeCount: number
}

/**
 * Post slug mode: permanent one-time like via /api/posts/[slug]/like (D3 legacy).
 * Entry id mode: toggle like/unlike via /api/entries/[id]/like (ed-015).
 */
export function LikeButton({ slug, entryId, initialLikeCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialLikeCount)
  const [submitting, setSubmitting] = useState(false)

  const toggleable = Boolean(entryId)
  const apiPath = entryId
    ? `/api/entries/${encodeURIComponent(entryId)}/like`
    : `/api/posts/${encodeURIComponent(slug ?? "")}/like`

  useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        const res = await fetch(apiPath, { method: "GET" })
        if (!res.ok || !mounted) return
        const body = (await res.json()) as {
          data: { liked: boolean; likeCount: number }
        }
        if (!mounted) return
        setLiked(body.data.liked)
        setCount(body.data.likeCount)
      } catch {
        // Keep initial state on fetch failure.
      }
    })()
    return () => {
      mounted = false
    }
  }, [apiPath])

  async function handleClick(): Promise<void> {
    if (submitting) return
    if (!toggleable && liked) return

    const prevLiked = liked
    const prevCount = count

    if (toggleable) {
      setLiked(!liked)
      setCount(liked ? prevCount - 1 : prevCount + 1)
    } else {
      setLiked(true)
      setCount(prevCount + 1)
    }

    setSubmitting(true)
    try {
      const res = await fetch(apiPath, { method: "POST" })
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

  const disabled = toggleable ? submitting : liked || submitting

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={liked}
      data-like-toggleable={toggleable ? "true" : "false"}
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-fg transition hover:text-fg focus-visible:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg aria-pressed:border-fg aria-pressed:text-fg disabled:cursor-not-allowed"
    >
      <span aria-hidden>♥</span>
      <span>{count}</span>
    </button>
  )
}
