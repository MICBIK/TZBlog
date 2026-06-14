import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '管理后台',
  description: 'TZBlog 管理后台',
};

export default function AdminDashboardPage() {
  return (
    <main>
      <h1 className="mb-6 text-3xl font-bold">管理后台</h1>
      <p className="text-muted-foreground">
        后台概览（占位）。后续将展示文章统计、最近编辑等内容。
      </p>
    </main>
  );
}
