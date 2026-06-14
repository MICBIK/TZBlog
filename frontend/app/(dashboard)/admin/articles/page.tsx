import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Pencil } from "lucide-react";

import { getArticles } from '@/lib/api/article';
import { Button } from '@/components/ui/button';
import { DeleteArticleButton } from '@/components/admin/DeleteArticleButton';

export const metadata: Metadata = {
  title: '文章管理',
  description: '管理 TZBlog 文章',
};

export const dynamic = 'force-dynamic';

interface AdminArticlesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminArticlesPage({
  searchParams,
}: AdminArticlesPageProps) {
  const { status } = await searchParams;
  const result = await getArticles({
    status: (status as 'draft' | 'published' | 'archived') ?? undefined,
    limit: 50,
  }).catch(() => ({ items: [], metadata: undefined }));
  const articles = result.items;

  const filters = [
    { label: '全部', value: '', active: !status },
    { label: '已发布', value: 'published', active: status === 'published' },
    { label: '草稿', value: 'draft', active: status === 'draft' },
  ];

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-mono text-xl font-bold">
          <span className="text-primary">~/</span>articles
        </h1>
        <Button asChild size="sm">
          <Link href="/admin/articles/new">
            <Plus className="size-4" />
            新建
          </Link>
        </Button>
      </div>

      {/* 状态筛选 */}
      <div className="mb-4 flex gap-2">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={
              f.value ? `/admin/articles?status=${f.value}` : '/admin/articles'
            }
            className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${
              f.active
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-primary'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* 文章表格 */}
      {articles.length > 0 ? (
        <div className="border-border overflow-x-auto rounded-lg border">
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
                <th className="px-4 py-2 text-right font-normal">操作</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className="border-border/50 hover:bg-muted/20 border-b last:border-0"
                >
                  <td className="max-w-xs truncate px-4 py-2.5">
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
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button
                        asChild
                        size="icon"
                        variant="ghost"
                        className="size-7"
                      >
                        <Link href={`/admin/articles/${article.id}/edit`}>
                          <Pencil className="size-3.5" />
                        </Link>
                      </Button>
                      <DeleteArticleButton
                        articleId={article.id}
                        title={article.title}
                      />
                    </div>
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
    </main>
  );
}
