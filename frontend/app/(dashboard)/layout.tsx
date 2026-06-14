import type { ReactNode } from 'react';

import { AdminGuard } from '@/components/shared/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

/**
 * 后台管理组布局。
 * AdminGuard 守卫 + 侧边栏 cockpit 布局。
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen flex-1">
        <AdminSidebar />
        <div className="flex-1 overflow-x-hidden">{children}</div>
      </div>
    </AdminGuard>
  );
}
