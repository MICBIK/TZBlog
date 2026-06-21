import type { Metadata } from 'next';

import { ArticleEditor } from '@/components/editor/ArticleEditor';
import { getCategories } from '@/lib/api/category';

export const metadata: Metadata = {
  title: '写文章 · tzblog 控制台',
  description: '后台 Markdown 写作 + 实时预览',
  robots: { index: false, follow: false },
};

export default async function NewArticlePage() {
  const categories = await getCategories().catch(() => []);
  return <ArticleEditor mode="create" categories={categories} />;
}
