"use client";

import * as React from "react";

import type { TocHeading } from "@/lib/markdown";

export interface PostTocProps {
  headings: TocHeading[];
}

export function PostToc({ headings }: PostTocProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const progress = readingProgress(headings, activeId);

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

  if (headings.length === 0) return null;

  return (
    <nav
      data-testid="post-toc"
      data-toc-stable-shell
      data-reduced-motion-safe
      className="space-y-4 font-mono text-xs"
    >
      <div
        role="progressbar"
        aria-label="阅读进度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        style={{ "--toc-progress": `${progress}%` } as React.CSSProperties}
        className="h-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          aria-hidden="true"
          className="h-full origin-left rounded-full bg-accent transition-transform"
          style={{ transform: "scaleX(calc(var(--toc-progress) / 100%))" }}
        />
      </div>
      <ul className="space-y-2">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id} className={heading.level === 3 ? "pl-3" : ""}>
              <a
                href={`#${heading.id}`}
                aria-current={active ? "location" : undefined}
                data-active={active ? "true" : "false"}
                className={
                  active
                    ? "grid grid-cols-[0.5rem_minmax(0,1fr)] items-center gap-2 font-medium text-fg"
                    : "grid grid-cols-[0.5rem_minmax(0,1fr)] items-center gap-2 font-medium text-muted-fg transition-colors hover:text-fg"
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    active
                      ? "h-1.5 w-1.5 rounded-full bg-accent"
                      : "h-1.5 w-1.5 rounded-full bg-transparent"
                  }
                />
                <span className="min-w-0 truncate">{heading.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function readingProgress(headings: TocHeading[], activeId: string | null): number {
  if (!activeId || headings.length === 0) return 0;

  const index = headings.findIndex((heading) => heading.id === activeId);
  if (index < 0) return 0;
  if (headings.length === 1) return 100;

  return Math.round((index / (headings.length - 1)) * 100);
}
