import type { Metadata } from 'next';

import { Empty } from '@/components/shared/Empty';

export const metadata: Metadata = {
  title: '文章',
  description: '浏览 TZBlog 的全部技术文章。',
};

/**
 * 文章列表页（占位）。
 * Phase 2 将接入 GET /articles 列表与分页。
 */
export default function ArticlesPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">文章</h1>
      <Empty
        title="文章列表即将上线"
        description="后端 API 联调后将在此展示文章列表与筛选功能。"
      />
    </main>
  );
}
