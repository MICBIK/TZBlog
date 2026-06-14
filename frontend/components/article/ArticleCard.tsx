import Link from 'next/link';
import { Eye, Heart, Clock, Lock } from 'lucide-react';

import type { ArticleSummary } from '@/types/article';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: ArticleSummary;
  index?: number;
  featured?: boolean;
  className?: string;
}

/**
 * 文章卡片（还原设计稿 .card）。
 * 序号前缀、mono 元信息、hover 磷光辉光边框 + 抬起阴影。
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
    : 'draft';

  return (
    <Link
      href={`/articles/${article.slug}`}
      className={cn(
        'border-border bg-card group relative block overflow-hidden rounded-[10px] border p-5 transition-all duration-200',
        'hover:border-[var(--acc-dim)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]',
        featured && 'sm:p-7',
        className,
      )}
    >
      {/* 序号（终端式） */}
      {index !== undefined && (
        <span className="text-muted/40 absolute right-4 top-4 font-mono text-xs">
          #{String(index).padStart(2, '0')}
        </span>
      )}

      <div className="space-y-3">
        {/* 元信息行 */}
        <div className="text-muted flex flex-wrap items-center gap-3 font-mono text-xs">
          <span>{date}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {article.readingTime}min
          </span>
          {article.isPremium && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1 text-[var(--amber)]">
                <Lock className="size-3" />
                premium
              </span>
            </>
          )}
        </div>

        {/* 标题 */}
        <h3
          className={cn(
            'group-hover:text-primary font-sans font-semibold leading-snug transition-colors',
            featured ? 'text-xl' : 'text-base',
          )}
        >
          {article.title}
        </h3>

        {/* 摘要 */}
        <p className="text-muted line-clamp-2 font-sans text-sm">
          {article.summary || '暂无摘要'}
        </p>

        {/* 底部统计 */}
        <div className="border-border/50 text-muted flex items-center gap-4 border-t pt-3 font-mono text-xs">
          <span className="flex items-center gap-1">
            <Eye className="size-3" />
            {article.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="size-3" />
            {article.likeCount}
          </span>
          <span className="group-hover:text-primary ml-auto text-[var(--dim)] transition-colors">
            cat {article.slug} →
          </span>
        </div>
      </div>

      {/* hover 时的磷光底线 */}
      <span className="bg-primary absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}
