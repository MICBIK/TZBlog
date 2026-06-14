import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { getArticleBySlug } from '@/lib/api/article';
import { MarkdownContent } from '@/components/article/MarkdownContent';
import { LikeButton } from '@/components/article/LikeButton';
import { ReadingProgress } from '@/components/article/ReadingProgress';
import { ArticleToc } from '@/components/article/ArticleToc';

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

/** 从 Markdown 内容提取 h2 作为 TOC */
function extractToc(content: string) {
  const lines = content.split('\n');
  const items: { id: string; text: string }[] = [];
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.startsWith('```')) inCodeBlock = !inCodeBlock;
    if (!inCodeBlock && line.startsWith('## ')) {
      const text = line.slice(3).trim();
      const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
      items.push({ id, text });
    }
  }
  return items;
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

  const tocItems = extractToc(article.content);

  return (
    <>
      <ReadingProgress />
      <main className="mx-auto max-w-[1080px] px-6 py-12">
        {/* 返回链接 */}
        <Link
          href="/articles"
          className="text-muted hover:text-acc mb-6 inline-flex items-center gap-1 font-mono text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          cd ../articles
        </Link>

        {/* 文章头部 */}
        <header className="border-line mb-8 border-b pb-6">
          <div className="text-dim mb-3 flex flex-wrap items-center gap-3 font-mono text-xs">
            {date && <span>{date}</span>}
            <span className="text-line">·</span>
            <span>{article.readingTime}min read</span>
            <span className="text-line">·</span>
            <span>{article.viewCount} views</span>
            {article.isPremium && <span className="text-amber">· premium</span>}
          </div>
          <h1 className="text-fg-strong font-sans text-[clamp(28px,4.4vw,46px)] font-bold leading-[1.18] tracking-[-.01em]">
            {article.title}
          </h1>
          {article.summary && (
            <p className="text-fg mt-4 max-w-[62ch] font-sans text-[clamp(15px,1.4vw,17px)] leading-[1.75] opacity-85">
              {article.summary}
            </p>
          )}
        </header>

        {/* layout — 正文 + TOC 侧边栏（设计稿 .layout）*/}
        <div className="grid grid-cols-1 gap-11 sm:grid-cols-[1fr_220px]">
          {/* 正文区 */}
          <div className="min-w-0">
            <MarkdownContent content={article.content} />

            {/* prev-next + 点赞（设计稿 .pn，第 103-108 行）*/}
            <div className="border-line mt-12 flex items-center justify-between border-t pt-6">
              <LikeButton
                articleId={article.id}
                initialCount={article.likeCount}
              />
              <span className="text-dim font-mono text-xs">
                <span className="text-acc">EOF</span> · exit 0
              </span>
            </div>
          </div>

          {/* TOC 侧边栏 — sticky */}
          {tocItems.length > 0 && (
            <aside className="max-sm:static max-sm:order-[-1] sm:sticky sm:top-[78px] sm:order-none">
              <ArticleToc items={tocItems} />
            </aside>
          )}
        </div>
      </main>
    </>
  );
}
