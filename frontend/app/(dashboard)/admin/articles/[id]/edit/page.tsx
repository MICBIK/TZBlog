import type { Metadata } from 'next';

import { getCategories } from '@/lib/api/category';
import { getArticleBySlug } from '@/lib/api/article';
import { ArticleEditor } from '@/components/editor/ArticleEditor';

export const metadata: Metadata = {
  title: '编辑文章',
  description: '编辑现有文章',
};

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({
  params,
}: EditArticlePageProps) {
  const { id } = await params;
  const numericId = Number(id);

  // 并行获取分类和文章数据
  const [categories, article] = await Promise.all([
    getCategories().catch(() => []),
    getArticleBySlug(id).catch(() => null),
  ]);

  // 将文章数据映射到表单初始值
  const initialData = article
    ? {
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: article.content,
        coverImage: article.coverImage,
        categoryId: article.categoryId,
        isPremium: article.isPremium,
      }
    : undefined;

  return (
    <main className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-mono text-2xl font-bold">
        编辑文章 #{numericId}
      </h1>
      <ArticleEditor
        mode="edit"
        articleId={numericId}
        initialData={initialData}
        categories={categories}
      />
    </main>
  );
}
