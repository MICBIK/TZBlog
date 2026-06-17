import type { Metadata } from 'next';

import { ArticleDetailClient } from './_components/ArticleDetailClient';

export const metadata: Metadata = {
  title: '文章详情',
  description: '浏览 TZBlog 的文章详情。',
};

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  return <ArticleDetailClient slug={slug} />;
}
