import type { Metadata } from 'next';

import { Empty } from '@/components/shared/Empty';

export const metadata: Metadata = {
  title: '归档',
  description: '按时间归档浏览 TZBlog 的全部文章。',
};

export default function ArchivePage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">归档</h1>
      <Empty
        title="时间归档即将上线"
        description="后端 API 联调后将在此展示按年月归档的文章列表。"
      />
    </main>
  );
}
