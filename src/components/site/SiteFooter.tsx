import Link from "next/link";
import { Github, Mail, Rss } from "lucide-react";

import { SITE_META } from "@/lib/site-meta";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border">
      <div
        data-site-footer-inner
        className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:px-8 lg:px-10"
      >
        <div className="space-y-2">
          <p className="text-sm leading-body text-muted-fg">{SITE_META.description}</p>
          <p className="text-sm text-fg">{SITE_META.author}</p>
          <p className="text-sm text-muted-fg">
            © {year} {SITE_META.author}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/rss.xml"
            className="inline-flex items-center gap-2 text-sm text-muted-fg transition-colors hover:text-fg"
          >
            <Rss className="h-4 w-4" aria-hidden="true" />
            RSS
          </Link>
          <Link
            href="https://github.com"
            aria-label="GitHub"
            className="text-muted-fg transition-colors hover:text-fg"
          >
            <Github className="h-4 w-4" />
          </Link>
          <Link
            href="mailto:hi@example.com"
            aria-label="Email"
            className="text-muted-fg transition-colors hover:text-fg"
          >
            <Mail className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
