import type { Metadata } from 'next';

import { Empty } from '@/components/shared/Empty';

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: '编辑文章',
  description: '编辑现有文章',
};

/**
 * 编辑文章页（占位）。
 * Phase 2 将根据 params.id 加载文章内容进入编辑器。
 */
export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  return (
    <main>
      <h1 className="mb-6 text-3xl font-bold">编辑文章 #{id}</h1>
      <Empty
        title="编辑器即将上线"
        description="将加载文章内容进入 Markdown 编辑器。"
      />
    </main>
  );
}
