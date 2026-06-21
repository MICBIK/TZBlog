import type { Metadata } from 'next';

import { AdminDashboardClient } from './AdminDashboardClient';

export const metadata: Metadata = {
  title: '控制台 · tzblog',
  description: 'TZBlog 后台管理仪表盘',
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
