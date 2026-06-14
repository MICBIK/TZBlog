import Link from 'next/link';

/**
 * 页脚（1:1 还原设计稿 front-home.html 第 171-187 行）。
 * .ft-main 4 列网格 + .ft-bottom 底部版权。
 */
export function Footer() {
  return (
    <footer className="border-line bg-bg2 relative z-[1] mt-10 border-t font-mono">
      {/* ft-main — 4 列 */}
      <div className="mx-auto grid max-w-[1080px] grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        {/* 品牌区 */}
        <div className="col-span-2 sm:col-span-1">
          <p className="text-acc text-[14px] font-bold">
            haiden@<span className="text-fg-strong">tzblog</span>
          </p>
          <p className="text-muted mt-3 max-w-[34ch] font-sans text-[13px] leading-[1.7]">
            记录 AI Coding、全栈工程、工具效率与随笔思考的中文技术博客。
          </p>
          <div className="mt-4 flex gap-2">
            {['GH', 'X', 'RSS'].map((s) => (
              <a
                key={s}
                href="#"
                className="border-line text-muted hover:border-acc-dim hover:text-acc grid size-8 place-items-center rounded-[7px] border text-[13px] transition-colors duration-[.16s]"
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {/* 导航列 */}
        <div>
          <h5 className="text-dim mb-3.5 font-mono text-[11px] uppercase tracking-[.1em]">
            explore
          </h5>
          {[
            { href: '/', label: 'home' },
            { href: '/articles', label: 'articles' },
            { href: '/archive', label: 'archive' },
            { href: '/search', label: 'search' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted hover:text-acc block py-1 font-sans text-[13px] transition-colors duration-[.14s]"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* 关于列 */}
        <div>
          <h5 className="text-dim mb-3.5 font-mono text-[11px] uppercase tracking-[.1em]">
            about
          </h5>
          {[
            { href: '/about', label: '关于' },
            { href: '/about', label: '友链' },
            { href: '/about', label: '订阅' },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-muted hover:text-acc block py-1 font-sans text-[13px] transition-colors duration-[.14s]"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* 标签云列 */}
        <div>
          <h5 className="text-dim mb-3.5 font-mono text-[11px] uppercase tracking-[.1em]">
            tags
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {['AI Coding', 'Next.js', 'Go', '工具', '随笔'].map((t) => (
              <Link
                key={t}
                href={`/articles?tag=${t}`}
                className="border-line2 text-muted hover:border-acc-dim hover:text-acc rounded-[5px] border px-2 py-1 text-[12px] transition-colors duration-[.15s]"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ft-bottom */}
      <div className="border-line border-t py-4">
        <div className="text-dim mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-2 px-6 font-mono text-[11.5px]">
          <span>
            <span className="text-acc-dim">haiden@tzblog</span>:~$ echo &quot;©{' '}
            {new Date().getFullYear()} TZBlog&quot;
          </span>
          <span>
            built with <b className="text-muted font-normal">Next.js + Go</b>
          </span>
        </div>
      </div>
    </footer>
  );
}
