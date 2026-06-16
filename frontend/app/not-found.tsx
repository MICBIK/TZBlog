import Link from 'next/link';

import { RequestedPath } from '@/components/404/RequestedPath';

/** 404 顶栏导航（还原原型第 55 行，独立于站点主导航的恢复屏精简版）*/
const NAV_404 = [
  { href: '/', label: 'home' },
  { href: '/search', label: 'search' },
  { href: '/archive', label: 'archive' },
  { href: '/about', label: 'about' },
] as const;

/**
 * 404 页面 — 1:1 还原原型 404.html。
 * 终端恢复屏：精简顶栏 + zsh 报错卡片。无营销底栏（对照 data-no-footer，
 * app 级 not-found 不渲染 (public) 布局的 Footer，天然满足）。
 */
export default function NotFound() {
  return (
    <>
      {/* 顶栏 — 还原 .topbar（恢复屏精简版：prompt + 4 链，无 login/cursor）*/}
      <header
        className="border-line sticky top-0 z-20 border-b backdrop-blur-[10px]"
        style={{ background: 'rgba(11,15,20,0.82)' }}
      >
        <div className="mx-auto flex h-[56px] max-w-[1080px] items-center gap-[22px] px-6">
          <span className="text-acc font-mono font-bold whitespace-nowrap">
            haiden@tzblog:<span className="text-fg-strong">~</span> $
          </span>
          <nav className="ml-auto flex flex-wrap gap-1">
            {NAV_404.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted hover:bg-panel2 hover:text-fg-strong rounded-[6px] px-[11px] py-1.5 font-mono text-[13.5px] transition-colors duration-[.16s] before:text-dim before:content-['./']"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* 主区 — 终端卡片居中 */}
      <main className="flex flex-1 items-center justify-center px-6 py-[60px]">
        <div className="border-line from-panel to-bg-2 w-full max-w-[620px] overflow-hidden rounded-[10px] border bg-gradient-to-b shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]">
          {/* 终端标题栏 - 红黄绿圆点 */}
          <div className="border-line bg-panel2 flex items-center gap-2 border-b px-[15px] py-[11px]">
            <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
            <span className="text-dim ml-2 font-mono text-[12.5px]">
              ~ — zsh — 404
            </span>
          </div>

          {/* 终端内容 */}
          <div className="px-[30px] py-[30px]">
            {/* 404 大标题 */}
            <div className="text-fg-strong font-sans text-[clamp(64px,14vw,120px)] leading-none font-bold tracking-[-0.02em]">
              4<span className="text-acc">0</span>4
            </div>

            {/* 命令行 — 回显访问者实际命中的路径 */}
            <p className="text-muted mt-[18px] mb-1 font-mono text-[13.5px]">
              <span className="text-acc">$</span> cat <RequestedPath />
            </p>

            {/* 错误信息 */}
            <p className="mb-5 font-mono text-[13.5px] text-[#ff7b9c]">
              zsh: no such file or directory — 你要找的页面走失了。
            </p>

            {/* 引导文字 */}
            <p className="text-fg mb-6 max-w-[48ch] font-sans text-[15px] opacity-85">
              它可能被归档、改名，或从未存在过。下面几条命令也许有用：
            </p>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-[10px]">
              <Link
                href="/"
                className="bg-acc rounded-[6px] border border-transparent px-[18px] py-[10px] font-mono text-[13.5px] font-bold text-[#06120b] transition-shadow duration-[.16s] before:opacity-60 before:content-['$_'] hover:shadow-[0_0_0_3px_rgba(63,224,143,0.18)]"
              >
                cd ~/home
              </Link>
              <Link
                href="/search"
                className="border-line2 text-fg hover:border-acc-dim hover:text-acc rounded-[6px] border px-[18px] py-[10px] font-mono text-[13.5px] transition-colors duration-[.16s]"
              >
                grep 全站搜索
              </Link>
              <Link
                href="/archive"
                className="border-line2 text-fg hover:border-acc-dim hover:text-acc rounded-[6px] border px-[18px] py-[10px] font-mono text-[13.5px] transition-colors duration-[.16s]"
              >
                ls 归档
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
