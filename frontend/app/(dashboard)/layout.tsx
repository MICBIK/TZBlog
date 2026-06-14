import type { ReactNode } from 'react';

import { AdminGuard } from '@/components/shared/AdminGuard';

/**
 * 后台管理组布局。
 * 用 AdminGuard 包裹，确保只有已登录的管理员能访问。
 * 完整侧边栏/顶栏将在批次 5 添加。
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </div>
    </AdminGuard>
  );
}
