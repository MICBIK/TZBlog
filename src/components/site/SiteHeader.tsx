import Link from "next/link";

const navLinks = [
  { href: "/posts", label: "文章" },
  { href: "/columns", label: "专栏" },
  { href: "/about", label: "关于" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-bg/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6 md:px-8">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-fg hover:opacity-80 transition-opacity"
        >
          TZBlog
        </Link>
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-fg hover:text-fg transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
