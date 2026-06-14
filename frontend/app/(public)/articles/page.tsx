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

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="font-mono text-2xl font-bold">
          <span className="text-primary">~/</span>articles
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {result.metadata?.total ?? 0} 篇文章
          {category ? ` · 分类: ${category}` : ''}
          {tag ? ` · 标签: #${tag}` : ''}
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
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-primary',
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
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-primary',
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
