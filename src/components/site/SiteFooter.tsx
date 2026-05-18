import Link from "next/link";
import { Github, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <p className="text-sm text-muted-fg">© 2026 HaiDen</p>
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com"
            aria-label="GitHub"
            className="text-muted-fg hover:text-fg transition-colors"
          >
            <Github className="h-4 w-4" />
          </Link>
          <Link
            href="mailto:hi@example.com"
            aria-label="Email"
            className="text-muted-fg hover:text-fg transition-colors"
          >
            <Mail className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
