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
      label: 'total posts',
      value: articles.length,
      sub: `${published} published · ${drafts} draft`,
      icon: FileText,
    },
    { label: 'total views', value: totalViews, icon: Eye },
    { label: 'total likes', value: totalLikes, icon: Heart },
  ];

  const recent = articles.slice(0, 5);

  return (
    <main className="p-6">
      {/* 命令行标题 */}
      <div className="mb-6">
        <h1 className="font-mono text-xl font-bold">
          <span className="text-primary">$</span> ./dashboard --stats
        </h1>
      </div>

      {/* 统计卡片 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="border-border bg-card rounded-[10px] border p-4 transition-colors hover:border-[var(--line-2)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--dim)]">
                  {stat.label}
                </span>
                <Icon className="text-muted size-4" />
              </div>
              <p className="font-mono text-2xl font-bold text-[var(--fg-strong)]">
                {stat.value}
              </p>
              {stat.sub && (
                <p className="text-muted mt-1 font-mono text-xs">{stat.sub}</p>
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
            <span className="text-primary">$</span> ls -lt recent/
          </h2>
          <Link
            href="/admin/articles"
            className="text-muted hover:text-primary font-mono text-xs transition-colors"
          >
            cat all →
          </Link>
        </div>

        {recent.length > 0 ? (
          <div className="border-border overflow-hidden rounded-[10px] border">
            <table className="w-full">
              <thead>
                <tr className="border-border bg-secondary/30 border-b font-mono text-xs text-[var(--dim)]">
                  <th className="px-4 py-2 text-left font-normal">title</th>
                  <th className="px-4 py-2 text-left font-normal">status</th>
                  <th className="hidden px-4 py-2 text-right font-normal sm:table-cell">
                    views
                  </th>
                  <th className="hidden px-4 py-2 text-right font-normal sm:table-cell">
                    likes
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {recent.map((article) => (
                  <tr
                    key={article.id}
                    className="border-border/50 hover:bg-secondary/20 border-b transition-colors last:border-0"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {article.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          article.status === 'published'
                            ? 'text-primary'
                            : 'text-[var(--amber)]'
                        }
                      >
                        {article.status}
                      </span>
                    </td>
                    <td className="text-muted hidden px-4 py-2.5 text-right sm:table-cell">
                      {article.viewCount}
                    </td>
                    <td className="text-muted hidden px-4 py-2.5 text-right sm:table-cell">
                      {article.likeCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-border text-muted rounded-[10px] border border-dashed py-12 text-center font-mono text-sm">
            暂无文章，
            <Link
              href="/admin/articles/new"
              className="text-primary hover:underline"
            >
              vim new-post.md →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
