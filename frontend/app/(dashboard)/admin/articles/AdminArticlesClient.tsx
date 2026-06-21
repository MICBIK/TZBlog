'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Pencil, Plus } from 'lucide-react';

import { getArticles } from '@/lib/api/article';
import { ApiRequestError } from '@/types/api';
import type { ArticleStatus, ArticleSummary } from '@/types/article';
import { DeleteArticleButton } from '@/components/admin/DeleteArticleButton';
import { Button } from '@/components/ui/button';

interface AdminArticlesClientProps {
  initialStatus?: ArticleStatus;
}

export function AdminArticlesClient({
  initialStatus,
}: AdminArticlesClientProps) {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filters = useMemo(
    () => [
      { label: '全部', value: '', active: !initialStatus },
      {
        label: '已发布',
        value: 'published',
        active: initialStatus === 'published',
      },
      { label: '草稿', value: 'draft', active: initialStatus === 'draft' },
      {
        label: '归档',
        value: 'archived',
        active: initialStatus === 'archived',
      },
    ],
    [initialStatus],
  );

  useEffect(() => {
    let active = true;

    async function loadArticles() {
      setLoading(true);
      setError('');

      try {
        const result = await getArticles({
          status: initialStatus,
          limit: 50,
        });

        if (!active) return;
        setArticles(result.items);
      } catch (err) {
        if (!active) return;
        setArticles([]);
        setError(
          err instanceof ApiRequestError
            ? err.message
            : '加载文章列表失败，请重试',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadArticles();

    return () => {
      active = false;
    };
  }, [initialStatus]);

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

      <div className="mb-4 flex gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={
              filter.value
                ? `/admin/articles?status=${filter.value}`
                : '/admin/articles'
            }
            className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${
              filter.active
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-primary'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="border-border text-muted-foreground flex items-center justify-center gap-2 rounded-lg border border-dashed py-12 font-mono text-sm">
          <Loader2 className="size-4 animate-spin" />
          loading articles...
        </div>
      ) : error ? (
        <div className="border-destructive/40 text-destructive rounded-lg border border-dashed py-12 text-center font-mono text-sm">
          {error}
        </div>
      ) : articles.length > 0 ? (
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
                        onDeleted={() =>
                          setArticles((current) =>
                            current.filter((item) => item.id !== article.id),
                          )
                        }
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
