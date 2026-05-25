import Link from "next/link";
import { format } from "date-fns";

import {
  entryHref,
  estimateReadingMinutes,
  readEntryCover,
  readReadingMinutes,
} from "./entryMeta";
import { LAYOUT_MOTION_CLASS } from "./_shared";
import type { ChannelLayoutProps } from "./types";

export function ChronicleLayout({ channelSlug, entries }: ChannelLayoutProps) {
  if (entries.length === 0) {
    return (
      <div
        data-testid="chronicle-empty-state"
        className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-fg"
      >
        这个频道还没有发布内容。
      </div>
    );
  }

  return (
    <div
      data-testid="chronicle-layout"
      data-layout="chronicle"
      className="mx-auto max-w-3xl space-y-10"
    >
      {entries.map((entry) => {
        const cover = readEntryCover(entry.metadata, entry.kind);
        const readingMinutes =
          readReadingMinutes(entry.metadata) ??
          estimateReadingMinutes(entry.title, entry.excerpt);
        const href = entryHref(channelSlug, entry.slug, entry.kind);

        return (
          <article
            key={entry.id}
            id={entry.slug}
            data-testid="chronicle-entry"
            data-cover-state={cover ? "with-cover" : "no-cover"}
            className="group grid gap-6 border-b border-border pb-10 last:border-b-0"
          >
            {cover ? (
              <div data-testid="chronicle-cover" className="overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover}
                  alt=""
                  width={1200}
                  height={675}
                  loading="lazy"
                  className={`aspect-[16/9] w-full object-cover ${LAYOUT_MOTION_CLASS} duration-300 group-hover:scale-[1.01]`}
                />
              </div>
            ) : (
              <div
                data-testid="chronicle-cover-placeholder"
                aria-hidden="true"
                className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 font-mono text-xs text-muted-fg"
              >
                无封面
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-fg">
                {entry.publishedAt ? (
                  <time dateTime={entry.publishedAt.toISOString()}>
                    {format(entry.publishedAt, "yyyy-MM-dd")}
                  </time>
                ) : null}
                <span>{readingMinutes} 分钟阅读</span>
              </div>

              <h2 className="font-serif text-2xl font-semibold tracking-tight text-fg md:text-3xl">
                <Link href={href} className={`${LAYOUT_MOTION_CLASS} hover:underline`}>
                  {entry.title}
                </Link>
              </h2>

              {entry.excerpt ? (
                <p className="text-base leading-relaxed text-muted-fg">
                  {entry.excerpt}
                </p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
