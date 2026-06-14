import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Eye, Heart, TrendingUp } from 'lucide-react';

import { getArticles } from '@/lib/api/article';

export const metadata: Metadata = {
  title: '管理后台',
  description: 'TZBlog 管理后台',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const result = await getArticles({ limit: 100 }).catch(() => ({
    items: [],
    metadata: undefined,
  }));
  const articles = result.items;

  const totalViews = articles.reduce((sum, a) => sum + a.viewCount, 0);
  const totalLikes = articles.reduce((sum, a) => sum + a.likeCount, 0);
  const published = articles.filter((a) => a.status === 'published').length;
  const drafts = articles.filter((a) => a.status === 'draft').length;

  const stats = [
    {
      label: '文章总数',
      value: articles.length,
      sub: `${published} 已发布 · ${drafts} 草稿`,
      icon: FileText,
    },
    { label: '总浏览', value: totalViews, icon: Eye },
    { label: '总点赞', value: totalLikes, icon: Heart },
  ];

  const recent = articles.slice(0, 5);

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="font-mono text-xl font-bold">
          <span className="text-primary">~/</span>dashboard
        </h1>
      </div>

      {/* 统计卡片 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="border-border bg-card rounded-lg border p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground font-mono text-xs">
                  {stat.label}
                </span>
                <Icon className="text-muted-foreground size-4" />
              </div>
              <p className="text-foreground font-mono text-2xl font-bold">
                {stat.value}
              </p>
              {stat.sub && (
                <p className="text-muted-foreground mt-1 font-mono text-xs">
                  {stat.sub}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 最近文章 */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-mono text-sm">
            <TrendingUp className="text-primary size-4" />
            最近文章
          </h2>
          <Link
            href="/admin/articles"
            className="text-muted-foreground hover:text-primary font-mono text-xs"
          >
            查看全部 →
          </Link>
        </div>

        {recent.length > 0 ? (
          <div className="border-border overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-border bg-muted/30 text-muted-foreground border-b font-mono text-xs">
                  <th className="px-4 py-2 text-left font-normal">标题</th>
                  <th className="px-4 py-2 text-left font-normal">状态</th>
                  <th className="hidden px-4 py-2 text-right font-normal sm:table-cell">
                    浏览
                  </th>
                  <th className="hidden px-4 py-2 text-right font-normal sm:table-cell">
                    点赞
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {recent.map((article) => (
                  <tr
                    key={article.id}
                    className="border-border/50 hover:bg-muted/20 border-b last:border-0"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="text-foreground hover:text-primary"
                      >
                        {article.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          article.status === 'published'
                            ? 'text-primary'
                            : 'text-amber'
                        }
                      >
                        {article.status}
                      </span>
                    </td>
                    <td className="text-muted-foreground hidden px-4 py-2.5 text-right sm:table-cell">
                      {article.viewCount}
                    </td>
                    <td className="text-muted-foreground hidden px-4 py-2.5 text-right sm:table-cell">
                      {article.likeCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-border text-muted-foreground rounded-lg border border-dashed py-12 text-center font-mono text-sm">
            暂无文章，
            <Link
              href="/admin/articles/new"
              className="text-primary hover:underline"
            >
              写一篇 →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
