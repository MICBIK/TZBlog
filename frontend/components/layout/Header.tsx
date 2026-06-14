'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';

/** 导航项 — 对照设计稿 front-home.html 第 206-213 行 */
const NAV_ITEMS = [
  { href: '/', label: 'home' },
  { href: '/articles', label: 'articles' },
  { href: '/archive', label: 'archive' },
  { href: '/search', label: 'search' },
  { href: '/about', label: 'about' },
];

/** 当前路径对应的 prompt path（终端语义）*/
function getPromptPath(pathname: string): string {
  if (pathname === '/') return '~';
  if (pathname.startsWith('/articles/')) return '~/posts';
  if (pathname.startsWith('/articles')) return '~/posts';
  if (pathname.startsWith('/archive')) return '~/archive';
  if (pathname.startsWith('/search')) return '~/search';
  if (pathname.startsWith('/about')) return '~/about';
  if (pathname.startsWith('/admin')) return '~/admin';
  return '~';
}

/**
 * 命令行顶栏（1:1 还原设计稿 .topbar）。
 * 第 56-70 行：sticky、backdrop-blur、prompt+cursor、./nav、login 按钮。
 */
export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, handleLogout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const promptPath = getPromptPath(pathname);

  return (
    <header
      className="border-line bg-bg/82 sticky top-0 z-20 border-b backdrop-blur-[10px]"
      style={{ background: 'rgba(11,15,20,0.82)' }}
    >
      <div className="mx-auto flex max-w-[1080px] items-center gap-[22px] px-6 [height:56px]">
        {/* prompt — 设计稿 .prompt */}
        <Link
          href="/"
          className="text-acc flex items-center whitespace-nowrap font-mono text-sm font-bold"
        >
          haiden@tzblog:
          <span className="text-fg-strong">{promptPath}</span>
          <span className="text-acc ml-0.5">$</span>
          <span
            className="bg-acc ml-[3px] inline-block w-2 [height:1.05em] [vertical-align:-2px]"
            style={{ animation: 'blink 1.1s steps(1) infinite' }}
          />
        </Link>

        {/* nav — 设计稿 .nav */}
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
                  'rounded-[6px] px-[11px] py-1.5 font-mono text-[13.5px] transition-colors duration-[.16s]',
                  active
                    ? 'bg-acc/[0.08] text-acc'
                    : 'text-muted hover:bg-panel2 hover:text-fg-strong',
                )}
              >
                <span className="text-dim mr-px">./</span>
                {item.label}
              </Link>
            );
          })}

          {/* login 按钮 — 设计稿 .login */}
          {isAuthenticated ? (
            <>
              <Link
                href="/admin"
                className="border-line2 text-fg hover:border-acc-dim hover:text-acc ml-2 rounded-[6px] border px-[13px] py-1.5 font-mono text-[13px] transition-colors duration-[.16s]"
              >
                ./admin
              </Link>
              <button
                onClick={handleLogout}
                className="border-line2 text-fg hover:border-acc-dim hover:text-acc rounded-[6px] border px-[13px] py-1.5 font-mono text-[13px] transition-colors duration-[.16s]"
              >
                logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="border-line2 text-fg hover:border-acc-dim hover:text-acc ml-2 rounded-[6px] border px-[13px] py-1.5 font-mono text-[13px] transition-colors duration-[.16s]"
            >
              login
            </Link>
          )}
        </nav>

        {/* 移动端 */}
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
        <nav className="border-line border-t px-6 py-3 sm:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="text-muted hover:text-acc block py-2 font-mono text-sm"
            >
              ./{item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="text-muted hover:text-acc block py-2 font-mono text-sm"
              >
                ./admin
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="text-muted hover:text-acc block py-2 font-mono text-sm"
              >
                ./logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-acc block py-2 font-mono text-sm"
            >
              ./login
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
