import type { Metadata } from 'next';

import { Empty } from '@/components/shared/Empty';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 文章详情页（占位）。
 * Phase 2 将通过 params.slug 调用 getArticleBySlug 渲染 Markdown 内容。
 */
export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <Empty
        title={`文章 ${slug}（占位）`}
        description="后端 API 联调后将在此渲染文章正文（Markdown）与作者信息。"
      />
    </main>
  );
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `文章 ${slug}`,
    description: 'TZBlog 文章详情（占位）',
  };
}
