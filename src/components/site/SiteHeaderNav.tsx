"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import type { HeaderNavLink } from "@/lib/navigation/publicNav";

export interface SiteHeaderNavProps {
  links: HeaderNavLink[];
}

export function SiteHeaderNav({ links }: SiteHeaderNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md p-2 text-muted-fg transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:hidden"
        aria-expanded={open}
        aria-controls="site-mobile-nav"
        aria-label={open ? "关闭导航菜单" : "打开导航菜单"}
        data-site-nav-toggle
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : null}
        {!open ? <Menu className="h-5 w-5" aria-hidden="true" /> : null}
      </button>

      <nav
        aria-label="主导航"
        data-site-header-nav
        className="hidden items-center gap-6 md:flex"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-muted-fg transition-colors hover:text-fg focus-visible:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <nav
        id="site-mobile-nav"
        aria-label="移动端主导航"
        data-site-mobile-nav
        hidden={!open}
        className="absolute left-0 right-0 top-16 border-b border-border bg-bg/95 px-6 py-4 backdrop-blur md:hidden"
      >
        <div className="flex flex-col gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-fg transition-colors hover:text-fg"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
