'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { MarkdownContent } from '@/components/article/MarkdownContent';
import { getArticleBySlug } from '@/lib/api/article';
import { getCommentsByArticle, type CommentItem } from '@/lib/api/comment';
import type { ArticleDetail } from '@/types/article';

import { ArticleProgress } from './ArticleProgress';
import { ArticleSidebar } from './ArticleSidebar';
import { CommentBox } from './CommentBox';

interface ArticleDetailClientProps {
  slug: string;
}

interface TocItem {
  id: string;
  text: string;
}

function slugifyHeading(text: string) {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
}

function buildTocItems(content: string): TocItem[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('## '))
    .map((line) => {
      const text = line.replace(/^##\s+/, '').trim();
      return { id: slugifyHeading(text), text };
    });
}

function formatDate(value?: string | null) {
  if (!value) return 'draft';
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function ArticleDetailClient({ slug }: ArticleDetailClientProps) {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const next = await getArticleBySlug(slug);
        if (!active) return;
        setArticle(next);
        const commentResult = await getCommentsByArticle(next.id, { limit: 20 });
        if (!active) return;
        setComments(commentResult.items);
      } catch (err) {
        if (!active) return;
        setArticle(null);
        setComments([]);
        setError(err instanceof Error ? err.message : 'Article not found');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const tocItems = useMemo(
    () => buildTocItems(article?.content ?? ''),
    [article?.content],
  );

  async function reloadComments() {
    if (!article) return;
    const commentResult = await getCommentsByArticle(article.id, { limit: 20 });
    setComments(commentResult.items);
  }

  if (loading) {
    return (
      <main className="relative z-[1] mx-auto grid min-h-[60vh] max-w-[1080px] place-items-center px-6 py-16">
        <div className="text-muted-foreground flex items-center gap-2 font-mono text-sm">
          <Loader2 className="size-4 animate-spin" />
          loading article...
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="relative z-[1] mx-auto max-w-[1080px] px-6 py-16">
        <div className="border-line bg-panel rounded-lg border p-6">
          <h1 className="text-fg-strong font-sans text-2xl font-bold">404</h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            {error || 'Article not found'}
          </p>
        </div>
      </main>
    );
  }

  const authorName =
    article.author?.displayName || article.author?.username || 'haiden';
  const authorInitial = authorName.trim().slice(0, 2).toUpperCase() || 'HA';

  return (
    <>
      <ArticleProgress />

      <main className="relative z-[1] mx-auto max-w-[1080px] px-6">
        <div className="grid grid-cols-1 items-start gap-7 py-[38px] pb-[70px] md:grid-cols-[1fr_240px] md:gap-[50px]">
          <article className="min-w-0">
            <p className="text-dim mb-[22px] font-mono text-[12.5px]">
              <span className="text-acc">$</span> cat{' '}
              <b className="text-muted-foreground font-normal">
                ~/posts/{article.slug}.md
              </b>
            </p>

            <h1 className="text-fg-strong max-w-[20ch] font-sans text-[clamp(28px,4vw,42px)] font-bold leading-[1.2] tracking-[-.01em]">
              {article.title}
            </h1>

            <div className="text-muted-foreground mb-1 mt-5 flex flex-wrap items-center gap-[11px] text-[13px]">
              <span className="border-[var(--acc-dim)] text-acc grid size-8 place-items-center rounded-[7px] border bg-[rgba(63,224,143,.1)] text-xs font-bold">
                {authorInitial}
              </span>
              <b className="text-fg-strong font-semibold">{authorName}</b>
              <span className="text-dim">·</span>
              <span>{formatDate(article.publishedAt || article.createdAt)}</span>
              <span className="text-dim">·</span>
              <span>{article.readingTime} min</span>
              <span className="text-dim">·</span>
              <span>{article.viewCount} 阅读</span>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-[7px]">
              {(article.tags ?? []).map((tag) => (
                <a
                  key={tag.id}
                  href={`/articles?tag=${tag.slug}`}
                  className="border-[var(--line-2)] text-muted-foreground hover:text-acc rounded-[5px] border px-2.5 py-1 text-xs transition-colors duration-150 before:text-[var(--dim)] before:content-['#'] hover:border-[var(--acc-dim)]"
                >
                  {tag.name}
                </a>
              ))}
            </div>

            <div className="border-line relative my-7 grid h-[200px] place-items-center overflow-hidden rounded-[10px] border bg-[linear-gradient(135deg,#0d1822,#0a0f15)] text-[13px] before:absolute before:inset-0 before:bg-[radial-gradient(rgba(63,224,143,.08)_1px,transparent_1px)] before:bg-[length:16px_16px]">
              <span className="text-muted-foreground relative">
                {article.summary || 'spec → verify → replay'}
              </span>
            </div>

            <div className="text-fg font-sans text-[16.5px] leading-[1.85]">
              <MarkdownContent content={article.content} />

              <section className="border-line mt-12 border-t pt-7">
                <div className="text-muted-foreground mb-[18px] font-mono text-[13px]">
                  <span className="text-acc">$</span> tail comments.log —{' '}
                  {comments.length} 条评论
                </div>
                <CommentBox articleId={article.id} onCreated={reloadComments} />
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <Comment
                      key={comment.id}
                      who={`@user-${comment.userId}`}
                      when={formatDate(comment.createdAt)}
                      text={comment.content}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    还没有评论，来写下第一条想法。
                  </p>
                )}
              </section>
            </div>
          </article>

          <ArticleSidebar
            articleId={article.id}
            items={tocItems}
            likeCount={article.likeCount}
          />
        </div>
      </main>
    </>
  );
}

function Comment({
  who,
  when,
  text,
}: {
  who: string;
  when: string;
  text: string;
}) {
  return (
    <div className="border-line bg-panel mb-3 rounded-lg border p-4">
      <div className="text-muted-foreground flex items-center gap-2 font-mono text-[12px]">
        <span className="text-acc">{who}</span>
        <span className="text-dim">·</span>
        <span>{when}</span>
      </div>
      <p className="text-fg mt-2 font-sans text-sm leading-[1.7]">{text}</p>
    </div>
  );
}
