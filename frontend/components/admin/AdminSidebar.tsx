'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/lib/hooks/useAuth';

const NAV_ITEMS = [
  { section: '概览' },
  { href: '/admin', label: '仪表盘', icon: '▦', exact: true },
  { href: '/admin/analytics', label: '数据分析', icon: '∿' },
  { section: '内容' },
  { href: '/admin/articles/new', label: '写文章', icon: '✎' },
  { href: '/admin/media', label: '媒体库', icon: '⊞' },
  { section: '系统' },
  { href: '/admin/settings', label: '站点设置', icon: '⚙' },
  { href: '/', label: '查看前台', icon: '↗', external: true },
];

/**
 * 后台侧边栏 - 严格对齐设计稿 admin-dashboard.html
 * 特征：磷光点品牌、分组标签、激活态左侧磷光条
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="flex h-screen w-[232px] flex-col overflow-y-auto border-r border-[#1d2530] bg-[#0d1219]">
      {/* 品牌区 */}
      <div className="flex items-center gap-[9px] border-b border-[#1d2530] px-5 pb-4 pt-[18px]">
        <span className="h-[9px] w-[9px] rounded-full bg-acc shadow-[0_0_8px_var(--acc)]" />
        <b className="font-mono text-[14px] tracking-[0.02em]">tzblog</b>
        <span className="font-mono text-[11px] text-muted">/admin</span>
      </div>

      {/* 导航区 */}
      <nav className="flex flex-1 flex-col gap-[2px] p-3">
        {NAV_ITEMS.map((item, idx) => {
          // 分组标题
          if ('section' in item) {
            return (
              <div
                key={idx}
                className="px-[10px] pb-[6px] pt-[14px] font-mono text-[10px] uppercase tracking-[0.12em] text-[#46505e]"
              >
                {item.section}
              </div>
            );
          }

          // 导航项
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-[10px] rounded-[7px] px-[10px] py-2 text-[13px] transition-[.15s] ${
                active
                  ? 'bg-acc/10 text-fg'
                  : 'text-[#aab3c0] hover:bg-panel hover:text-fg'
              }`}
            >
              {/* 激活态左侧磷光条 */}
              {active && (
                <span className="absolute -left-3 bottom-[7px] top-[7px] w-[2px] rounded-[2px] bg-acc shadow-[0_0_6px_var(--acc)]" />
              )}
              <span
                className={`w-[15px] text-center font-mono text-[13px] ${
                  active ? 'text-acc' : 'text-muted'
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 用户区 */}
      <div className="flex items-center gap-[10px] border-t border-[#1d2530] px-4 py-3">
        <div className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border border-line bg-panel font-mono text-[13px] text-acc">
          {user?.username?.[0]?.toUpperCase() ?? 'H'}
        </div>
        <div>
          <div className="text-[13px]">{user?.username ?? 'haiden'}</div>
          <div className="font-mono text-[11px] text-muted">
            {user?.role === 'admin' ? '站长' : '用户'}
          </div>
        </div>
      </div>
    </aside>
  );
}
