"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

import { entryHref } from "./entryMeta";
import type { ChannelLayoutProps } from "./types";

type FeedLayoutProps = ChannelLayoutProps & {
  batchSize?: number;
};

export function FeedLayout({
  channelSlug,
  entries,
  batchSize = 12,
}: FeedLayoutProps) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
    const node = sentinelRef.current;
    if (!node || visibleCount >= entries.length) return;

    const observer = new IntersectionObserver((records) => {
      if (records.some((record) => record.isIntersecting)) {
        setVisibleCount((current) =>
          Math.min(current + batchSize, entries.length),
        );
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [batchSize, entries.length, visibleCount]);

  if (entries.length === 0) {
    return (
      <div
        data-testid="feed-empty-state"
        className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-fg"
      >
        这个频道还没有发布内容。
      </div>
    );
  }

  const visibleEntries = entries.slice(0, visibleCount);

  return (
    <div className="space-y-4">
      <div
        data-testid="feed-layout"
        data-layout="feed"
        className="[column-count:1] [column-gap:1rem] md:[column-count:2] lg:[column-count:3]"
      >
        {visibleEntries.map((entry) => {
          const href = entryHref(channelSlug, entry.slug, entry.kind);
          return (
            <article
              key={entry.id}
              id={entry.slug}
              data-testid="feed-entry"
              className="mb-4 break-inside-avoid rounded-xl border border-border p-4"
            >
              {entry.publishedAt ? (
                <time
                  dateTime={entry.publishedAt.toISOString()}
                  className="font-mono text-xs text-muted-fg"
                >
                  {format(entry.publishedAt, "yyyy-MM-dd HH:mm")}
                </time>
              ) : null}
              <h2 className="mt-2 text-base font-semibold text-fg">
                <Link href={href} className="hover:underline">
                  {entry.title}
                </Link>
              </h2>
              {entry.excerpt ? (
                <p className="mt-2 text-sm text-muted-fg">{entry.excerpt}</p>
              ) : null}
            </article>
          );
        })}
      </div>
      {visibleCount < entries.length ? (
        <div
          ref={sentinelRef}
          data-testid="feed-load-sentinel"
          aria-hidden="true"
          className="h-8"
        />
      ) : null}
    </div>
  );
}
