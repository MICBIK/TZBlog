import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Eye } from 'lucide-react';

import { getArticleBySlug } from '@/lib/api/article';
import { MarkdownContent } from '@/components/article/MarkdownContent';
import { LikeButton } from '@/components/article/LikeButton';
import { ReadingProgress } from '@/components/article/ReadingProgress';

export const revalidate = 60;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await getArticleBySlug(slug);
    return {
      title: article.title,
      description: article.summary || article.title,
    };
  } catch {
    return { title: '文章未找到' };
  }
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;

  let article;
  try {
    article = await getArticleBySlug(slug);
  } catch {
    notFound();
  }

  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <>
      <ReadingProgress />
      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* 返回链接 */}
        <Link
          href="/articles"
          className="text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-1 font-mono text-sm"
        >
          <ArrowLeft className="size-4" />
          ../articles
        </Link>

        {/* 文章头部 */}
        <header className="border-border mb-8 border-b pb-6">
          <div className="text-muted-foreground mb-3 flex flex-wrap items-center gap-3 font-mono text-xs">
            <span>{date}</span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {article.readingTime} 分钟阅读
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1">
              <Eye className="size-3" />
              {article.viewCount} 次浏览
            </span>
            {article.isPremium && (
              <span className="text-amber">· 付费内容</span>
            )}
          </div>
          <h1 className="text-3xl font-bold leading-tight">{article.title}</h1>
          {article.summary && (
            <p className="text-muted-foreground mt-3">{article.summary}</p>
          )}
        </header>

        {/* Markdown 正文 */}
        <MarkdownContent content={article.content} />

        {/* 底部操作 */}
        <footer className="border-border mt-12 flex items-center justify-between border-t pt-6">
          <LikeButton articleId={article.id} initialCount={article.likeCount} />
          <span className="text-muted-foreground font-mono text-xs">
            EOF · {article.readingTime}min read
          </span>
        </footer>
      </main>
    </>
  );
}
