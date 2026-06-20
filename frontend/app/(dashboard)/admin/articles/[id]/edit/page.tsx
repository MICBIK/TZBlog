import type { Metadata } from 'next';

import { getCategories } from '@/lib/api/category';

import { EditArticleClient } from './EditArticleClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '写文章 · tzblog 控制台',
  description: '编辑现有文章',
  robots: { index: false, follow: false },
};

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const articleId = Number(id);
  const categories = await getCategories().catch(() => []);
  return <EditArticleClient articleId={articleId} categories={categories} />;
}
