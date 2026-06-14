import type { Metadata } from 'next';

import { getCategories } from '@/lib/api/category';
import { ArticleEditor } from '@/components/editor/ArticleEditor';

export const metadata: Metadata = {
  title: '新建文章',
  description: '撰写新文章',
};

export default async function NewArticlePage() {
  const categories = await getCategories().catch(() => []);

  return (
    <main className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-mono text-2xl font-bold">新建文章</h1>
      <ArticleEditor mode="create" categories={categories} />
    </main>
  );
}
