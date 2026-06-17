'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

import { MarkdownContent } from '@/components/article/MarkdownContent';
import { getArticleBySlug } from '@/lib/api/article';
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
      } catch (err) {
        if (!active) return;
        setArticle(null);
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

  useEffect(() => {
    if (!article) return;
    document.title = `${article.title} · tzblog`;
    const description =
      article.summary || '浏览 TZBlog 的文章详情。';
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [article]);

  const tocItems = useMemo(
    () => buildTocItems(article?.content ?? ''),
    [article?.content],
  );

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

              <div className="mt-12 grid grid-cols-1 gap-3.5 md:grid-cols-2">
                <Link
                  href="/articles/nextjs-15-rsc-cache"
                  className="border-line bg-panel hover:bg-panel2 rounded-lg border px-4 py-3.5 transition-colors duration-150 hover:border-[var(--acc-dim)]"
                >
                  <div className="text-[var(--acc-dim)] font-mono text-[11.5px]">
                    ← prev
                  </div>
                  <div className="text-fg-strong mt-[5px] font-sans text-sm leading-[1.4]">
                    Next.js 15 RSC 缓存的 7 个坑
                  </div>
                </Link>
                <Link
                  href="/articles/rewrite-backend-node-to-go"
                  className="border-line bg-panel hover:bg-panel2 rounded-lg border px-4 py-3.5 text-right transition-colors duration-150 hover:border-[var(--acc-dim)]"
                >
                  <div className="text-[var(--acc-dim)] font-mono text-[11.5px]">
                    next →
                  </div>
                  <div className="text-fg-strong mt-[5px] font-sans text-sm leading-[1.4]">
                    把后端从 Node 重写成 Go
                  </div>
                </Link>
              </div>

              <section className="border-line mt-12 border-t pt-7">
                <div className="text-muted-foreground mb-[18px] font-mono text-[13px]">
                  <span className="text-acc">$</span> tail comments.log —{' '}
                  {article.commentCount} 条评论
                </div>
                <CommentBox />
                <Comment
                  who="@林深"
                  when="2 天前"
                  text="spec 那段直接照搬到我们 CI 里了，agent 返工率肉眼可见下降。请问 replay 的 trace 格式方便开源一下吗？"
                />
                <Comment
                  who="@coderwang"
                  when="4 天前"
                  text="“把最快的反馈给 agent”——这句点醒我了，之前一直只靠 e2e 兜底，循环慢得要死。"
                />
                <Comment
                  who="@阿吉"
                  when="5 天前"
                  text="3000 行一次跑通有点夸张，但顺序倒过来这个思路确实成立，已经在小功能上验证了。"
                />
              </section>
            </div>
          </article>

          <ArticleSidebar items={tocItems} likeCount={article.likeCount} />
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
