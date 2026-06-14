import type { Metadata } from 'next';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Empty } from '@/components/shared/Empty';

export const metadata: Metadata = {
  title: '文章管理',
  description: '管理 TZBlog 文章',
};

export default function AdminArticlesPage() {
  return (
    <main>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">文章管理</h1>
        <Button asChild>
          <Link href="/admin/articles/new">新建文章</Link>
        </Button>
      </div>
      <Empty
        title="暂无文章"
        description="后端 API 联调后将在此展示文章列表，支持编辑、删除等操作。"
      />
    </main>
  );
}
