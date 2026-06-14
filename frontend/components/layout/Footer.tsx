import Link from 'next/link';

export function Footer() {
  return (
    <footer className="z-1 border-border relative mt-10 border-t bg-gradient-to-b from-transparent to-black/25 font-mono">
      <div className="mx-auto max-w-[1080px] px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* 品牌区 */}
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span className="text-primary font-bold">haiden@tzblog</span>
            <p className="text-muted font-sans text-[13.5px] leading-relaxed">
              个人技术博客 · 记录代码与思考
            </p>
          </div>

          {/* 导航列 */}
          <nav className="text-muted flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <Link
              href="/about"
              className="hover:text-primary transition-colors"
            >
              about
            </Link>
            <Link
              href="/archive"
              className="hover:text-primary transition-colors"
            >
              archive
            </Link>
            <Link
              href="/articles"
              className="hover:text-primary transition-colors"
            >
              articles
            </Link>
            <a
              href="https://github.com/MICBIK/TZBlog"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              github
            </a>
            <a
              href="/feed.xml"
              className="hover:text-primary transition-colors"
            >
              rss
            </a>
          </nav>
        </div>

        {/* 底部版权 */}
        <div className="border-border mt-6 border-t pt-4">
          <p className="text-center text-[12px] text-[var(--dim)]">
            <span className="text-primary">haiden@tzblog</span>:~$ echo &quot;©
            {new Date().getFullYear()} TZBlog · Built with Next.js + Go ·
            terminal aesthetic&quot;
          </p>
        </div>
      </div>
    </footer>
  );
}
