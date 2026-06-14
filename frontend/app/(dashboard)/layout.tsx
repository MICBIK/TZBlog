import type { ReactNode } from 'react';

/**
 * 后台管理组布局。
 * Phase 2 将加入侧边栏导航与登录态守卫。
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
  );
}
