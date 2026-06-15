import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-[60px]">
      <div className="border-line w-full max-w-[620px] overflow-hidden rounded-[10px] border bg-gradient-to-b from-panel to-bg-2 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]">
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
          <div className="text-fg-strong font-sans text-[clamp(64px,14vw,120px)] font-bold leading-none tracking-[-0.02em]">
            4<span className="text-acc">0</span>4
          </div>

          {/* 命令行 */}
          <p className="text-muted mb-1 mt-[18px] font-mono text-[13.5px]">
            <span className="text-acc">$</span> cat{' '}
            <span className="text-amber">requested-page</span>
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
              className="rounded-r border border-transparent bg-acc px-[18px] py-[10px] font-mono text-[13.5px] font-bold text-[#06120b] transition-shadow duration-[.16s] before:opacity-60 before:content-['$_'] hover:shadow-[0_0_0_3px_rgba(63,224,143,0.18)]"
            >
              cd ~/home
            </Link>
            <Link
              href="/search"
              className="border-line2 text-fg rounded-r border px-[18px] py-[10px] font-mono text-[13.5px] transition-colors duration-[.16s] hover:border-acc-dim hover:text-acc"
            >
              grep 全站搜索
            </Link>
            <Link
              href="/archive"
              className="border-line2 text-fg rounded-r border px-[18px] py-[10px] font-mono text-[13.5px] transition-colors duration-[.16s] hover:border-acc-dim hover:text-acc"
            >
              ls 归档
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
