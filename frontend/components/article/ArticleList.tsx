import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { ArticleSummary } from '@/types/article';
import { ArticleCard } from '@/components/article/ArticleCard';
import { Empty } from '@/components/shared/Empty';
import { Skeleton } from '@/components/ui/skeleton';

interface ArticleListProps {
  articles: ArticleSummary[];
  loading?: boolean;
  /** 当前页（1-based） */
  page?: number;
  /** 总页数 */
  totalPages?: number;
  /** 基础路径（用于分页链接，如 /articles） */
  basePath?: string;
}

/**
 * 文章列表容器（含分页）。
 */
export function ArticleList({
  articles,
  loading = false,
  page = 1,
  totalPages = 1,
  basePath = '/articles',
}: ArticleListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <Empty title="暂无文章" description="还没有发布任何文章，敬请期待。" />
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article, i) => (
        <ArticleCard
          key={article.id}
          article={article}
          index={i + 1 + (page - 1) * 10}
        />
      ))}

      {/* 分页 */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-6">
          {page > 1 ? (
            <Link
              href={`${basePath}?page=${page - 1}`}
              className="border-border text-muted-foreground hover:border-primary/40 hover:text-primary flex size-9 items-center justify-center rounded border transition-colors"
            >
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span className="border-border/50 text-muted-foreground/30 flex size-9 items-center justify-center rounded border">
              <ChevronLeft className="size-4" />
            </span>
          )}

          <span className="text-muted-foreground font-mono text-sm">
            {page} / {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={`${basePath}?page=${page + 1}`}
              className="border-border text-muted-foreground hover:border-primary/40 hover:text-primary flex size-9 items-center justify-center rounded border transition-colors"
            >
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className="border-border/50 text-muted-foreground/30 flex size-9 items-center justify-center rounded border">
              <ChevronRight className="size-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
