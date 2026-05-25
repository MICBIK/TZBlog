"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useMemo, useState } from "react";

import { entryHref } from "./entryMeta";
import type { ChannelLayoutProps } from "./types";

function readSource(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "—";
  }
  const value = metadata as Record<string, unknown>;
  if (typeof value.domain === "string" && value.domain) return value.domain;
  if (typeof value.sourceUrl === "string" && value.sourceUrl) {
    try {
      return new URL(value.sourceUrl).hostname;
    } catch {
      return value.sourceUrl;
    }
  }
  return "—";
}

function formatTags(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) return "—";
  return tags.join(", ");
}

export function GrepLayout({ channelSlug, entries }: ChannelLayoutProps) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return entries;
    return entries.filter((entry) => {
      const haystack = `${entry.title} ${entry.excerpt ?? ""} ${readSource(entry.metadata)} ${formatTags(entry.tags)}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [entries, normalizedQuery]);

  if (entries.length === 0) {
    return (
      <div
        data-testid="grep-empty-state"
        className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-fg"
      >
        这个频道还没有发布内容。
      </div>
    );
  }

  return (
    <div data-testid="grep-layout" data-layout="grep" className="space-y-4">
      <div className="sticky top-0 z-10 border-b border-border bg-bg/95 py-3 backdrop-blur">
        <label className="block font-mono text-xs text-muted-fg">
          grep
          <input
            type="search"
            aria-label="筛选条目"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="filter…"
            data-testid="grep-filter-input"
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-fg outline-none ring-ring focus-visible:ring-2"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table
          data-testid="grep-table"
          className="w-full table-fixed border-collapse font-mono text-sm"
        >
          <colgroup>
            <col className="w-12" />
            <col className="w-28" />
            <col />
            <col className="w-36" />
            <col className="w-40" />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-fg">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2" data-testid="grep-col-time">
                time
              </th>
              <th className="px-3 py-2" data-testid="grep-col-title">
                title
              </th>
              <th className="px-3 py-2" data-testid="grep-col-source">
                source
              </th>
              <th className="px-3 py-2" data-testid="grep-col-tags">
                tags
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              const visible = filtered.some((row) => row.id === entry.id);
              const href = entryHref(channelSlug, entry.slug, entry.kind);
              const haystack = `${entry.title} ${entry.excerpt ?? ""} ${readSource(entry.metadata)} ${formatTags(entry.tags)}`.toLowerCase();
              const highlighted =
                normalizedQuery.length > 0 && haystack.includes(normalizedQuery);

              return (
                <tr
                  key={entry.id}
                  id={entry.slug}
                  data-testid="grep-row"
                  data-highlight={highlighted ? "true" : "false"}
                  className={visible ? "border-b border-border/60" : "hidden"}
                >
                  <td className="px-3 py-2 text-muted-fg">{index + 1}</td>
                  <td className="truncate px-3 py-2 whitespace-nowrap text-muted-fg">
                    {entry.publishedAt
                      ? format(entry.publishedAt, "yyyy-MM-dd")
                      : "—"}
                  </td>
                  <td className="truncate px-3 py-2">
                    <Link
                      href={href}
                      className={
                        highlighted
                          ? "terminal-link rounded bg-accent/15 px-1 text-fg underline"
                          : "terminal-link text-fg hover:underline"
                      }
                    >
                      {entry.title}
                    </Link>
                  </td>
                  <td className="truncate px-3 py-2 text-muted-fg">
                    {readSource(entry.metadata)}
                  </td>
                  <td className="truncate px-3 py-2 text-muted-fg">
                    {formatTags(entry.tags)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
