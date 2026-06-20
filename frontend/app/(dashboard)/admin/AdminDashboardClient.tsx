'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { getArticles } from '@/lib/api/article';
import { getComments } from '@/lib/api/comment';
import { ApiRequestError } from '@/types/api';
import type { ArticleSummary } from '@/types/article';

import { DashboardTopbar } from './_components/DashboardTopbar';

interface DashboardState {
  articles: ArticleSummary[];
  articleTotal: number;
  publishedTotal: number;
  draftTotal: number;
  commentTotal: number;
}

const emptyState: DashboardState = {
  articles: [],
  articleTotal: 0,
  publishedTotal: 0,
  draftTotal: 0,
  commentTotal: 0,
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

export function AdminDashboardClient() {
  const [data, setData] = useState<DashboardState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [allArticles, publishedArticles, draftArticles, comments] =
          await Promise.all([
            getArticles({ limit: 5 }),
            getArticles({ status: 'published', limit: 1 }),
            getArticles({ status: 'draft', limit: 1 }),
            getComments({ limit: 1 }),
          ]);

        if (!active) return;
        setData({
          articles: allArticles.items,
          articleTotal: allArticles.metadata?.total ?? allArticles.items.length,
          publishedTotal: publishedArticles.metadata?.total ?? 0,
          draftTotal: draftArticles.metadata?.total ?? 0,
          commentTotal: comments.metadata?.total ?? comments.items.length,
        });
      } catch (err) {
        if (!active) return;
        setData(emptyState);
        setError(
          err instanceof ApiRequestError
            ? err.message
            : '加载控制台数据失败，请重试',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const stats = [
    { label: '文章总数', value: String(data.articleTotal), note: '真实 API' },
    { label: '已发布', value: String(data.publishedTotal), note: 'published' },
    { label: '草稿', value: String(data.draftTotal), note: 'draft' },
    { label: '评论总数', value: String(data.commentTotal), note: 'comments' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardTopbar />

      <div className="w-full max-w-[1180px] px-[26px] pb-10 pt-6">
        <div className="mb-7 grid grid-cols-4 gap-[14px] max-[880px]:grid-cols-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-[11px] border border-line bg-panel px-[17px] py-4"
            >
              <div className="font-mono text-[11px] tracking-[0.04em] text-dim">
                {stat.label}
              </div>
              <div className="my-2 font-mono text-[28px] font-semibold">
                {loading ? (
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                ) : (
                  stat.value
                )}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {stat.note}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="border-destructive/40 text-destructive mb-5 rounded-[11px] border bg-panel px-4 py-3 font-mono text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-[1.55fr_1fr] items-start gap-5 max-[980px]:grid-cols-1">
          <div className="overflow-hidden rounded-[11px] border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line px-4 py-[13px]">
              <span className="font-mono text-[12.5px] text-[#aab3c0]">
                $ articles --latest
              </span>
              <Link
                href="/admin/articles"
                className="font-mono text-[11.5px] text-dim hover:text-acc"
              >
                管理全部 →
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 px-4 py-10 font-mono text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                loading articles...
              </div>
            ) : data.articles.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-line px-4 py-[10px] text-left font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#46505e]">
                      文章
                    </th>
                    <th className="border-b border-line px-4 py-[10px] text-left font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#46505e]">
                      状态
                    </th>
                    <th className="border-b border-line px-4 py-[10px] text-right font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#46505e]">
                      阅读
                    </th>
                    <th className="border-b border-line px-4 py-[10px] text-right font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#46505e]">
                      更新
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.articles.map((article) => (
                    <tr
                      key={article.id}
                      className="transition-colors hover:bg-[#0d1219]"
                    >
                      <td className="border-b border-[#0d1219] px-4 py-[11px] align-middle text-[13px]">
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="font-medium text-fg hover:text-acc"
                        >
                          {article.title}
                        </Link>
                      </td>
                      <td className="border-b border-[#0d1219] px-4 py-[11px]">
                        <span
                          className={`inline-block rounded-[5px] border px-2 py-[3px] font-mono text-[10.5px] ${
                            article.status === 'published'
                              ? 'border-acc-dim bg-acc/8 text-acc'
                              : 'border-[rgba(232,179,57,0.4)] bg-[rgba(232,179,57,0.08)] text-[#e8b339]'
                          }`}
                        >
                          {article.status}
                        </span>
                      </td>
                      <td className="border-b border-[#0d1219] px-4 py-[11px] text-right font-mono tabular-nums text-[#aab3c0]">
                        {article.viewCount}
                      </td>
                      <td className="border-b border-[#0d1219] px-4 py-[11px] text-right font-mono tabular-nums text-[#aab3c0]">
                        {formatDate(article.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-10 font-mono text-sm text-muted-foreground">
                暂无文章。先去{' '}
                <Link href="/admin/articles/new" className="text-acc">
                  写一篇
                </Link>
                。
              </div>
            )}
          </div>

          <div className="rounded-[11px] border border-line bg-panel px-4 py-4">
            <div className="font-mono text-[12.5px] text-[#aab3c0]">
              $ dashboard --coverage
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              当前控制台仅展示后端已提供的文章与评论聚合。
              访客趋势、来源分析、待审队列和媒体统计尚无后端接口，
              因此不在 dashboard 上继续展示模拟数据。
            </p>
            <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs">
              <Link
                href="/admin/articles"
                className="rounded border border-line px-3 py-1 text-muted-foreground hover:text-acc"
              >
                articles
              </Link>
              <Link
                href="/admin/settings"
                className="rounded border border-line px-3 py-1 text-muted-foreground hover:text-acc"
              >
                settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
