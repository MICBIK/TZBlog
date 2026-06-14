import type { Metadata } from 'next';

import { Empty } from '@/components/shared/Empty';

export const metadata: Metadata = {
  title: '新建文章',
  description: '撰写新文章',
};

/**
 * 新建文章页（占位）。
 * Phase 2 将集成 @uiw/react-md-editor 编辑器。
 */
export default function NewArticlePage() {
  return (
    <main>
      <h1 className="mb-6 text-3xl font-bold">新建文章</h1>
      <Empty
        title="编辑器即将上线"
        description="将集成 Markdown 编辑器，支持实时预览与图片上传。"
      />
    </main>
  );
}
