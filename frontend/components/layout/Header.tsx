'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

/** 导航项 */
const NAV_ITEMS = [
  { href: '/', label: 'home' },
  { href: '/articles', label: 'articles' },
  { href: '/archive', label: 'archive' },
  { href: '/about', label: 'about' },
];

/**
 * 命令行风格顶栏。
 * 磷光绿 prompt + 等宽字体，呼应终端母题。
 */
export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, handleLogout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [prevPath, setPrevPath] = useState(pathname);
  // 路由变化时关闭移动端菜单（render 阶段同步，避免 effect 级联渲染）
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  return (
    <header className="border-border bg-background/80 sticky top-0 z-50 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* 左：命令行 prompt */}
        <Link
          href="/"
          className="group flex items-center gap-1.5 font-mono text-sm"
        >
          <span className="text-muted-foreground">haiden@tzblog</span>
          <span className="text-muted-foreground">:</span>
          <span className="text-primary">~</span>
          <span className="text-muted-foreground">$</span>
          <span className="text-foreground">cd /home</span>
          <span className="animate-glow-pulse bg-primary ml-0.5 inline-block size-1.5 rounded-full" />
        </Link>

        {/* 中/右：桌面导航 */}
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded px-2.5 py-1 font-mono text-sm transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                ./{item.label}
              </Link>
            );
          })}
          <div className="bg-border mx-2 h-4 w-px" />
          {isAuthenticated ? (
            <>
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-foreground rounded px-2.5 py-1 font-mono text-sm"
              >
                ./admin
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground font-mono text-sm"
              >
                logout
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm" className="font-mono">
              <Link href="/login">./login</Link>
            </Button>
          )}
        </nav>

        {/* 移动端菜单按钮 */}
        <button
          className="text-muted-foreground sm:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="菜单"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* 移动端展开菜单 */}
      {mobileOpen && (
        <nav className="border-border border-t px-4 py-3 sm:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground block py-2 font-mono text-sm"
            >
              ./{item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground block py-2 font-mono text-sm"
            >
              ./admin
            </Link>
          ) : (
            <Link
              href="/login"
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
