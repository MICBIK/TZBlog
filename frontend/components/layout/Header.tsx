'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'home' },
  { href: '/articles', label: 'articles' },
  { href: '/archive', label: 'archive' },
  { href: '/about', label: 'about' },
];

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, handleLogout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-border bg-background/82 sticky top-0 z-20 border-b backdrop-blur-[10px]">
      <div
        className="mx-auto flex max-w-[1080px] items-center gap-[22px] px-6"
        style={{ height: 56 }}
      >
        {/* 命令行 prompt */}
        <Link
          href="/"
          className="flex items-center whitespace-nowrap font-mono text-sm"
        >
          <span className="text-primary font-bold">haiden@tzblog</span>
          <span className="text-muted-foreground">:</span>
          <span className="text-primary">~</span>
          <span className="text-muted-foreground">$</span>
          <span className="cursor-blink" />
        </Link>

        {/* 桌面导航 */}
        <nav className="ml-auto hidden flex-wrap items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded px-[11px] py-1.5 font-mono text-[13.5px] transition-colors',
                  active
                    ? 'bg-primary/[0.08] text-primary'
                    : 'text-muted hover:bg-secondary hover:text-foreground',
                )}
              >
                <span className="mr-px text-[var(--dim)]">./</span>
                {item.label}
              </Link>
            );
          })}

          {isAuthenticated ? (
            <>
              <Link
                href="/admin"
                className="text-muted hover:bg-secondary hover:text-foreground rounded px-[11px] py-1.5 font-mono text-[13.5px] transition-colors"
              >
                <span className="mr-px text-[var(--dim)]">./</span>
                admin
              </Link>
              <button
                onClick={handleLogout}
                className="text-foreground hover:text-primary ml-2 rounded border border-[var(--line-2)] px-[13px] py-1.5 font-mono text-[13px] transition-colors hover:border-[var(--acc-dim)]"
              >
                logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-foreground hover:text-primary ml-2 rounded border border-[var(--line-2)] px-[13px] py-1.5 font-mono text-[13px] transition-colors hover:border-[var(--acc-dim)]"
            >
              ./login
            </Link>
          )}
        </nav>

        {/* 移动端菜单按钮 */}
        <button
          className="text-muted ml-auto sm:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="菜单"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* 移动端展开 */}
      {mobileOpen && (
        <nav className="border-border border-t px-6 py-3 sm:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="text-muted hover:text-primary block py-2 font-mono text-sm"
            >
              ./{item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="text-muted hover:text-primary block py-2 font-mono text-sm"
              >
                ./admin
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="text-muted hover:text-primary block py-2 font-mono text-sm"
              >
                ./logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-primary block py-2 font-mono text-sm"
            >
              ./login
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
