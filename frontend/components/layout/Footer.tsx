import Link from 'next/link';

/**
 * 页脚。
 * 终端风格，简洁信息 + 命令行 prompt 收尾。
 */
export function Footer() {
  return (
    <footer className="border-border border-t">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-muted-foreground font-mono text-xs">
            <span className="text-primary">haiden@tzblog</span>
            <span>:~$ </span>
            <span>
              echo &quot;© 2026 TZBlog · Built with Next.js + Go&quot;
            </span>
          </div>
          <nav className="text-muted-foreground flex gap-4 font-mono text-xs">
            <Link href="/about" className="hover:text-primary">
              about
            </Link>
            <Link href="/archive" className="hover:text-primary">
              archive
            </Link>
            <a
              href="https://github.com/MICBIK/TZBlog"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              github
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
