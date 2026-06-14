'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, Terminal } from 'lucide-react';

import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard, exact: true },
  { href: '/admin/articles', label: '文章', icon: FileText },
  { href: '/admin/settings', label: '设置', icon: Settings },
];

/**
 * 后台侧边栏（cockpit 人格）。
 * 克制用绿：仅激活态用品牌色。
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="border-sidebar-border bg-sidebar flex w-16 flex-col border-r sm:w-56">
      {/* Logo */}
      <div className="border-sidebar-border flex h-14 items-center gap-2 border-b px-4">
        <Terminal className="text-sidebar-primary size-4" />
        <span className="hidden font-mono text-sm font-semibold sm:inline">
          tzblog
        </span>
      </div>

      {/* 导航 */}
      <nav className="flex-1 space-y-1 p-2">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded px-3 py-2 font-mono text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 用户信息 */}
      <div className="border-sidebar-border border-t p-3">
        <div className="flex items-center gap-2">
          <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-xs">
            {user?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="text-sidebar-foreground truncate font-mono text-xs">
              {user?.username ?? 'unknown'}
            </p>
            <p className="text-muted-foreground font-mono text-[10px]">
              {user?.role ?? 'user'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
