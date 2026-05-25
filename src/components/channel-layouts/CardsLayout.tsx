import Link from "next/link";
import { format } from "date-fns";

import {
  entryHref,
  readEntryCover,
} from "./entryMeta";
import { LAYOUT_MOTION_CLASS } from "./_shared";
import type { ChannelLayoutProps } from "./types";

export function CardsLayout({ channelSlug, entries }: ChannelLayoutProps) {
  if (entries.length === 0) {
    return (
      <div
        data-testid="cards-empty-state"
        className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-fg"
      >
        这个频道还没有发布内容。
      </div>
    );
  }

  return (
    <ul
      data-testid="cards-layout"
      data-layout="cards"
      className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
    >
      {entries.map((entry) => {
        const cover = readEntryCover(entry.metadata, entry.kind);
        const href = entryHref(channelSlug, entry.slug, entry.kind);

        return (
          <li key={entry.id} id={entry.slug}>
            <Link
              href={href}
              data-testid="cards-entry"
              data-interactive-surface="cards-entry"
              data-cover-state={cover ? "with-cover" : "no-cover"}
              className={`group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-bg ${LAYOUT_MOTION_CLASS} hover:-translate-y-0.5 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            >
              {cover ? (
                <div className="aspect-[16/10] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover}
                    alt=""
                    width={800}
                    height={500}
                    loading="lazy"
                    className={`h-full w-full object-cover ${LAYOUT_MOTION_CLASS} duration-300 group-hover:scale-[1.02]`}
                  />
                </div>
              ) : (
                <div
                  data-testid="cards-cover-placeholder"
                  aria-hidden="true"
                  className="flex aspect-[16/10] items-center justify-center border-b border-dashed border-border bg-muted/30 font-mono text-xs text-muted-fg"
                >
                  无封面
                </div>
              )}

              <div className="flex flex-1 flex-col gap-2 p-4">
                {entry.publishedAt ? (
                  <time
                    dateTime={entry.publishedAt.toISOString()}
                    className="font-mono text-xs text-muted-fg"
                  >
                    {format(entry.publishedAt, "yyyy-MM-dd")}
                  </time>
                ) : null}
                <h2 className="text-lg font-semibold text-fg group-hover:underline">
                  {entry.title}
                </h2>
                {entry.excerpt ? (
                  <p className="line-clamp-3 text-sm text-muted-fg">
                    {entry.excerpt}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
