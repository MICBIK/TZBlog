import Link from 'next/link';
import { Eye, Heart, Clock, Lock } from 'lucide-react';

import type { ArticleSummary } from '@/types/article';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: ArticleSummary;
  /** 序号（用于终端式列表展示） */
  index?: number;
  /** 是否为精选（hero 下方的大卡片） */
  featured?: boolean;
  className?: string;
}

/**
 * 文章卡片。
 * 终端风格：序号前缀、mono 字体元信息、hover 磷光辉光边框。
 */
export function ArticleCard({
  article,
  index,
  featured = false,
  className,
}: ArticleCardProps) {
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : '草稿';

  return (
    <Link
      href={`/articles/${article.slug}`}
      className={cn(
        'border-border bg-card hover:border-primary/40 group relative block overflow-hidden rounded-lg border p-5 transition-all hover:shadow-[0_0_12px_rgba(63,224,143,0.08)]',
        featured && 'sm:p-7',
        className,
      )}
    >
      {/* 序号（终端式） */}
      {index !== undefined && (
        <span className="text-muted-foreground/50 absolute right-4 top-4 font-mono text-xs">
          #{String(index).padStart(2, '0')}
        </span>
      )}

      <div className="space-y-3">
        {/* 元信息行 */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 font-mono text-xs">
          <span>{date}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {article.readingTime} 分钟
          </span>
          {article.isPremium && (
            <>
              <span className="text-border">·</span>
              <span className="text-amber flex items-center gap-1">
                <Lock className="size-3" />
                付费
              </span>
            </>
          )}
        </div>

        {/* 标题 */}
        <h3
          className={cn(
            'group-hover:text-primary font-semibold leading-snug transition-colors',
            featured ? 'text-xl' : 'text-base',
          )}
        >
          {article.title}
        </h3>

        {/* 摘要 */}
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {article.summary || '暂无摘要'}
        </p>

        {/* 底部统计 */}
        <div className="border-border/50 text-muted-foreground flex items-center gap-4 border-t pt-3 font-mono text-xs">
          <span className="flex items-center gap-1">
            <Eye className="size-3" />
            {article.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="size-3" />
            {article.likeCount}
          </span>
        </div>
      </div>

      {/* hover 时的磷光指示器 */}
      <span className="bg-primary absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}
