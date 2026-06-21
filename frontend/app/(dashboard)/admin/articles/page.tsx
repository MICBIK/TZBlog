import type { Metadata } from 'next';

import { AdminArticlesClient } from './AdminArticlesClient';

export const metadata: Metadata = {
  title: '文章管理',
  description: '管理 TZBlog 文章',
};

export const dynamic = 'force-dynamic';

interface AdminArticlesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminArticlesPage({
  searchParams,
}: AdminArticlesPageProps) {
  const { status } = await searchParams;
  return (
    <AdminArticlesClient
      initialStatus={
        status === 'draft' || status === 'published' || status === 'archived'
          ? status
          : undefined
      }
    />
  );
}
