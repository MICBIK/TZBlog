'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { getArticles } from '@/lib/api/article';
import { getCategories } from '@/lib/api/category';
import { getComments } from '@/lib/api/comment';
import { getTags } from '@/lib/api/tag';
import type { ArticleSummary, Category, Tag } from '@/types/article';
import type { CommentItem } from '@/lib/api/comment';

interface HomeData {
  articles: ArticleSummary[];
  categories: Category[];
  tags: Tag[];
  comments: CommentItem[];
  totalArticles: number;
}

function formatDate(value?: string | null) {
  if (!value) return 'draft';
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function HomeRealtime() {
  const [data, setData] = useState<HomeData>({
    articles: [],
    categories: [],
    tags: [],
    comments: [],
    totalArticles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [articleResult, categories, tags, comments] = await Promise.all([
          getArticles({ page: 1, limit: 6, status: 'published', sort: 'publishedAt:desc' }).catch(() => ({
            items: [] as ArticleSummary[],
            metadata: undefined,
          })),
          getCategories().catch(() => []),
          getTags().catch(() => []),
          getComments({ page: 1, limit: 3 }).catch(() => ({ items: [], metadata: undefined })),
        ]);

        if (!active) return;

        setData({
          articles: articleResult.items,
          totalArticles: articleResult.metadata?.total ?? articleResult.items.length,
          categories,
          tags,
          comments: comments.items,
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const pinned = data.articles[0] ?? null;
  const recent = pinned ? data.articles.slice(1) : data.articles;

  return (
    <>
      <section className="pb-[30px] pt-[46px] max-[860px]:pb-[18px] max-[860px]:pt-[30px]">
        <div className="overflow-hidden rounded-[10px] border border-line bg-gradient-to-b from-panel to-bg2 shadow-[0_30px_80px_-40px_rgba(0,0,0,.8)]">
          <div className="bg-panel2 flex items-center gap-2 border-b border-line px-[15px] py-[11px]">
            <span className="size-[11px] rounded-full bg-[#ff5f57]" />
            <span className="size-[11px] rounded-full bg-[#febc2e]" />
            <span className="size-[11px] rounded-full bg-[#28c840]" />
            <span className="text-dim ml-2 text-[12.5px]">
              ~/posts/{pinned?.slug ?? 'published'}.md
            </span>
          </div>
          <div className="px-[30px] pb-[30px] pt-[26px]">
            <p className="text-muted mb-[18px] text-[13.5px]">
              <span className="text-acc">$</span> cat{' '}
              <span className="text-amber">latest.md</span> --render
            </p>
            <span className="text-amber mb-3.5 inline-flex items-center gap-1.5 text-[11.5px] uppercase tracking-[.12em] before:content-['★']">
              最新发布
            </span>
            <h1 className="text-fg-strong max-w-[18ch] font-sans text-[clamp(28px,4.4vw,46px)] font-bold leading-[1.18] tracking-[-.01em]">
              {pinned?.title ?? '暂无已发布文章'}
            </h1>
            <p className="text-fg mt-4 max-w-[62ch] font-sans text-[clamp(15px,1.4vw,17px)] leading-[1.75] opacity-85">
              {pinned?.summary ?? '首页已切换为真实后端数据驱动；在没有已发布文章时，这里会明确降级而不是继续展示硬编码内容。'}
            </p>
            <div className="text-muted mt-6 flex flex-wrap items-center gap-[11px] text-[13px]">
              <span className="border-acc-dim bg-acc/10 text-acc grid size-[34px] place-items-center rounded-[7px] border text-[12px] font-bold">
                HA
              </span>
              <span>
                <b className="text-fg-strong font-semibold">haiden</b>
              </span>
              <span className="text-dim">·</span>
              <span>{formatDate(pinned?.publishedAt ?? pinned?.createdAt)}</span>
              <span className="text-dim">·</span>
              <span>{pinned?.readingTime ?? 0} min</span>
              <span className="text-dim">·</span>
              <span>{pinned?.viewCount ?? 0} 阅读</span>
            </div>
            <div className="mt-[26px] flex flex-wrap gap-2.5">
              {pinned ? (
                <Link
                  href={`/articles/${pinned.slug}`}
                  className="bg-acc relative overflow-hidden rounded-[6px] px-[18px] py-2.5 text-[13.5px] font-bold text-[#06120b] transition-[.16s] before:opacity-60 before:content-['$_'] hover:shadow-[0_0_0_3px_rgba(63,224,143,.18)]"
                >
                  read
                </Link>
              ) : null}
              <Link
                href="/articles"
                className="border-line2 text-fg hover:border-acc-dim hover:text-acc rounded-[6px] border px-[18px] py-2.5 text-[13.5px] transition-[.16s]"
              >
                查看全部文章
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-11 pb-[70px] pt-3.5 min-[861px]:grid-cols-[1fr_300px] max-[860px]:gap-[30px]">
        <div>
          <div className="text-muted mb-4 mt-1.5 flex items-center gap-2 text-[13px]">
            <span className="text-acc">$</span> ls -lt posts/
            <span className="text-dim ml-auto text-[12px]"># 真实后端返回 · 最近更新</span>
          </div>

          {recent.length > 0 ? (
            recent.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="post border-line bg-panel hover:border-acc-dim hover:bg-panel2 relative mb-3 block overflow-hidden rounded-[8px] border px-5 py-[18px] transition-[.18s] hover:translate-x-[3px]"
              >
                <div className="text-dim mb-2 flex flex-wrap gap-3 text-[11.5px]">
                  <span className="text-acc-dim">-rw-r--r--</span>
                  <span>{formatDate(article.publishedAt)}</span>
                  <span className="text-muted before:text-dim before:content-['#']">{article.status}</span>
                </div>
                <h3 className="text-fg-strong font-sans text-[18px] font-semibold leading-[1.4]">
                  {article.title}
                </h3>
                <p className="text-muted mt-[7px] font-sans text-[14px] leading-[1.65] opacity-90">
                  {article.summary || '暂无摘要'}
                </p>
                <div className="text-dim mt-3 flex gap-4 text-[11.5px]">
                  <span><b className="text-fg font-semibold">{article.readingTime}</b> min</span>
                  <span><b className="text-fg font-semibold">{article.viewCount}</b> 阅读</span>
                  <span><b className="text-fg font-semibold">{article.likeCount}</b> 赞</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="border-line bg-panel rounded-[8px] border px-5 py-[18px] text-sm text-muted-foreground">
              {loading ? 'loading articles...' : '当前没有可展示的已发布文章，首页不再使用硬编码占位文章冒充真实内容。'}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-[18px] min-[861px]:sticky min-[861px]:top-[78px] max-[860px]:static">
          <div className="widget border-line bg-panel overflow-hidden rounded-[8px] border">
            <div className="widget-h bg-panel2 text-muted border-line border-b px-[15px] py-[11px] text-[12.5px]">
              <span className="text-acc">$</span> stat ./site
            </div>
            <div className="p-[15px]">
              {[
                ['已发布文章', String(data.totalArticles)],
                ['分类数', String(data.categories.length)],
                ['标签数', String(data.tags.length)],
                ['最新评论', String(data.comments.length)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-[5px] text-[13px]">
                  <span className="text-muted">{label}</span>
                  <span className="text-acc font-semibold tabular-nums">{value}</span>
                </div>
              ))}
              <p className="mt-3 text-[11.5px] text-dim">
                累计字数、收藏总量等聚合指标当前未提供公开 API，首页已明确降级而非继续展示硬编码数值。
              </p>
            </div>
          </div>

          <div className="widget border-line bg-panel overflow-hidden rounded-[8px] border">
            <div className="widget-h bg-panel2 text-muted border-line border-b px-[15px] py-[11px] text-[12.5px]">
              <span className="text-acc">$</span> tail comments.log
            </div>
            <div className="p-[15px]">
              {data.comments.length > 0 ? (
                data.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-line text-fg border-b border-dashed py-[9px] font-sans text-[13px] last:border-0"
                  >
                    <span className="text-acc font-mono text-[12px]">@user-{comment.userId}</span>：{comment.content}
                    <div className="text-dim mt-[3px] text-[11.5px]">
                      article #{comment.articleId} · {formatDate(comment.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[13px] text-muted-foreground">暂无最新评论数据。</div>
              )}
            </div>
          </div>

          <div className="widget border-line bg-panel overflow-hidden rounded-[8px] border">
            <div className="widget-h bg-panel2 text-muted border-line border-b px-[15px] py-[11px] text-[12.5px]">
              <span className="text-acc">$</span> ls tags/
            </div>
            <div className="flex flex-wrap gap-[7px] p-[15px]">
              {data.tags.length > 0 ? (
                data.tags.slice(0, 12).map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/search?tag=${tag.slug}`}
                    className="border-line2 text-muted hover:border-acc-dim hover:text-acc rounded-[5px] border px-[9px] py-1 text-[12px] transition-[.15s]"
                  >
                    {tag.name}
                  </Link>
                ))
              ) : (
                <span className="text-[12px] text-dim">暂无标签数据</span>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
