import Link from 'next/link';

import type { ArticleSummary } from '@/types/article';
import { cn } from '@/lib/utils';

interface ArticlePostProps {
  article: ArticleSummary;
  /** 权限位风格元信息（如标签）*/
  tags?: string[];
  className?: string;
}

/**
 * 文章条目（1:1 还原设计稿 .post，第 107-118 行）。
 * ls 样式：perm 权限位 + 日期 + #tag、hover 左边框磷光条 + translateX。
 * post-foot 底部统计（阅读时长/浏览/赞/收藏）。
 */
export function ArticlePost({ article, className }: ArticlePostProps) {
  const date = article.publishedAt
    ? new Date(article.publishedAt)
        .toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        .replace(/\//g, '-')
    : 'draft';

  return (
    <Link
      href={`/articles/${article.slug}`}
      className={cn(
        'border-line bg-panel group relative mb-3 block overflow-hidden rounded-[8px] border p-[18px_20px]',
        'hover:border-acc-dim hover:bg-panel2 transition-[.18s]',
        'hover:translate-x-[3px]',
        className,
      )}
    >
      {/* hover 左边框磷光条 — ::before */}
      <span className="bg-acc absolute bottom-0 left-0 top-0 w-0.5 origin-top scale-y-0 transition-[.22s] group-hover:scale-y-100" />

      {/* post-meta — ls 权限位风格 */}
      <div className="text-dim mb-2 flex flex-wrap gap-3 font-mono text-[11.5px]">
        <span className="text-acc-dim">-rw-r--r--</span>
        <span>{date}</span>
        {article.isPremium && <span className="text-amber">premium</span>}
      </div>

      {/* 标题 */}
      <h3 className="text-fg-strong group-hover:text-acc font-sans text-[18px] font-semibold leading-[1.4] transition-colors">
        {article.title}
      </h3>

      {/* 摘要 */}
      <p className="text-muted mt-[7px] font-sans text-[14px] leading-[1.65] opacity-90">
        {article.summary || '暂无摘要'}
      </p>

      {/* post-foot — 统计 */}
      <div className="text-dim mt-3 flex gap-4 font-mono text-[11.5px]">
        <span>
          <b className="text-fg font-semibold">{article.readingTime}</b> min
        </span>
        <span>
          <b className="text-fg font-semibold">{article.viewCount}</b> 阅读
        </span>
        <span>
          <b className="text-fg font-semibold">{article.likeCount}</b> 赞
        </span>
      </div>
    </Link>
  );
}
