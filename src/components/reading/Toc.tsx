"use client";

import * as React from "react";

import type { TocHeading } from "@/lib/markdown";

export interface TocProps {
  headings: TocHeading[];
  contentLength: number;
  minLength?: number;
  placement?: "inline" | "sidebar" | "both";
}

export function Toc({
  headings,
  contentLength,
  minLength = 1000,
  placement = "both",
}: TocProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (headings.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries.find((entry) => entry.isIntersecting);
        if (activeEntry?.target.id) {
          setActiveId(activeEntry.target.id);
        }
      },
      { rootMargin: "-80px 0px -50% 0px" },
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (contentLength <= minLength || headings.length === 0) {
    return null;
  }

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
    window.history.replaceState(null, "", `#${id}`);
  };

  const list = (
    <ul className="space-y-2">
      {headings.map((heading) => {
        const active = heading.id === activeId;
        return (
          <li key={heading.id} className={heading.level === 3 ? "pl-3" : ""}>
            <a
              href={`#${heading.id}`}
              aria-current={active ? "location" : undefined}
              data-active={active ? "true" : "false"}
              onClick={(event) => handleClick(event, heading.id)}
              className={
                active
                  ? "block font-medium text-fg transition-colors"
                  : "block font-medium text-muted-fg transition-colors hover:text-fg"
              }
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ul>
  );

  const showInline = placement === "inline" || placement === "both";
  const showSidebar = placement === "sidebar" || placement === "both";

  return (
    <>
      {showInline ? (
        <div data-testid="reading-toc-mobile" className="md:hidden">
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="reading-toc-panel"
            data-toc-toggle
            onClick={() => setMobileOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-fg"
          >
            <span>目录</span>
            <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
          </button>
          {mobileOpen ? (
            <nav
              id="reading-toc-panel"
              aria-label="文章目录"
              data-testid="reading-toc"
              className="mt-2 rounded-md border border-border bg-card p-3 font-mono text-xs"
            >
              {list}
            </nav>
          ) : null}
        </div>
      ) : null}

      {showSidebar ? (
        <aside
          aria-label="文章目录"
          data-testid="reading-toc"
          data-toc-desktop
          className="hidden md:block"
        >
          <nav className="sticky top-24 space-y-3 font-mono text-xs">{list}</nav>
        </aside>
      ) : null}
    </>
  );
}
