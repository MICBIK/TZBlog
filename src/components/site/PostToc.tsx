"use client";

import * as React from "react";

import type { TocHeading } from "@/lib/markdown";

export interface PostTocProps {
  headings: TocHeading[];
}

export function PostToc({ headings }: PostTocProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

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
    <nav data-testid="post-toc" className="font-mono text-xs">
      <ul className="space-y-2">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id} className={heading.level === 3 ? "pl-3" : ""}>
              <a
                href={`#${heading.id}`}
                className={
                  active
                    ? "font-medium text-fg"
                    : "text-muted-fg transition-colors hover:text-fg"
                }
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
