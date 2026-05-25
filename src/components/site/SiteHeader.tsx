import Link from "next/link";
import { Palette } from "lucide-react";

import {
  buildHeaderNavLinks,
  type HeaderChannel,
} from "@/lib/navigation/publicNav";
import { SITE_META } from "@/lib/site-meta";

import { SiteHeaderNav } from "./SiteHeaderNav";

export interface SiteHeaderProps {
  channels: HeaderChannel[];
}

export function SiteHeader({ channels }: SiteHeaderProps) {
  const navLinks = buildHeaderNavLinks(channels);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div
        data-site-header-inner
        className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8 lg:px-10"
      >
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-fg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {SITE_META.name}
        </Link>

        <div className="flex items-center gap-2">
          <SiteHeaderNav links={navLinks} />
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            hidden
            data-admin-theme-toggle
            className="hidden"
          >
            <Palette className="h-4 w-4" aria-hidden="true" />
            <span>主题</span>
          </button>
        </div>
      </div>
    </header>
  );
}
