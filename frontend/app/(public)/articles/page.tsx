import type { Metadata } from 'next';
import Link from 'next/link';

import { getArticles } from '@/lib/api/article';
import { getCategories } from '@/lib/api/category';
import { ArticleList } from '@/components/article/ArticleList';
import { cn } from '@/lib/utils';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '文章',
  description: '浏览 TZBlog 的全部技术文章。',
};

interface ArticlesPageProps {
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>;
}

export default async function ArticlesPage({
  searchParams,
}: ArticlesPageProps) {
  const { page: pageStr, category, tag } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const [result, categories] = await Promise.all([
    getArticles({ page, limit: 10, category, tag, status: 'published' }).catch(
      () => ({ items: [], metadata: undefined }),
    ),
    getCategories().catch(() => []),
  ]);

  const totalPages = result.metadata?.totalPages ?? 1;
  const total = result.metadata?.total ?? 0;

  return (
    <main className="mx-auto max-w-[1080px] px-6 py-12">
      {/* 终端标题 */}
      <div className="mb-6">
        <h1 className="font-mono text-xl font-bold">
          <span className="text-primary">$</span> ls -la{' '}
          <span className="text-[var(--amber)]">./articles/</span>
        </h1>
        <p className="text-muted mt-1 font-mono text-xs">
          total {total} ·{' '}
          {category ? `category: ${category}` : 'all categories'}
          {tag ? ` · tag: #${tag}` : ''}
        </p>
      </div>

      {/* 分类筛选 */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/articles"
            className={cn(
              'rounded border px-3 py-1 font-mono text-xs transition-colors',
              !category
                ? 'bg-primary/10 text-primary border-[var(--acc-dim)]'
                : 'border-border text-muted hover:text-primary',
            )}
          >
            all
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/articles?category=${cat.slug}`}
              className={cn(
                'rounded border px-3 py-1 font-mono text-xs transition-colors',
                category === cat.slug
                  ? 'bg-primary/10 text-primary border-[var(--acc-dim)]'
                  : 'border-border text-muted hover:text-primary',
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* 文章列表 */}
      <ArticleList
        articles={result.items}
        page={page}
        totalPages={totalPages}
        basePath="/articles"
      />
    </main>
  );
}
