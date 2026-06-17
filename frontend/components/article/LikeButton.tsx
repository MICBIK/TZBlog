'use client';

import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { likeArticle, unlikeArticle } from '@/lib/api/like';
import { ApiRequestError } from '@/types/api';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  articleId: number;
  initialLiked?: boolean;
  initialCount: number;
}

/**
 * 点赞按钮。
 * 乐观更新 UI，失败时回滚 + toast 提示。
 * 后端 likes 表修复中（D2），失败时静默降级。
 */
export function LikeButton({
  articleId,
  initialLiked = false,
  initialCount,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    const prevLiked = liked;
    const prevCount = count;

    // 乐观更新
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setLoading(true);

    try {
      const result = prevLiked
        ? await unlikeArticle(articleId)
        : await likeArticle(articleId);
      setLiked(result.liked);
      setCount(result.likeCount);
    } catch (err) {
      // 回滚
      setLiked(prevLiked);
      setCount(prevCount);
      // D2 期间静默降级（后端 likes 表 schema 修复中）
      if (!(err instanceof ApiRequestError && err.status === 500)) {
        toast.error('操作失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-mono text-sm transition-all',
        liked
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary',
      )}
      aria-pressed={liked}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Heart className={cn('size-4', liked && 'fill-current')} />
      )}
      <span>{count}</span>
    </button>
  );
}
