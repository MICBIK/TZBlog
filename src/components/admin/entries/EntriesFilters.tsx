"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ArticleFilterInput } from "@/lib/schemas/entry";

export type EntriesFilter = ArticleFilterInput;

export interface EntriesFiltersProps {
  currentFilter: EntriesFilter;
  columns: Array<{ id: string; name: string }>;
  tags: Array<{ slug: string; name: string }>;
}

const ALL_VALUE = "__all__";

export function EntriesFilters({
  currentFilter,
  columns,
  tags,
}: EntriesFiltersProps) {
  const router = useRouter();
  const [q, setQ] = useState<string>(currentFilter.q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statusValue = currentFilter.status ?? ALL_VALUE;
  const channelValue = currentFilter.channelId ?? ALL_VALUE;
  const tagValue = currentFilter.tag ?? ALL_VALUE;

  const hasActiveFilter = Boolean(
    currentFilter.q ||
      currentFilter.status ||
      currentFilter.channelId ||
      currentFilter.tag,
  );

  const tagOptions = useMemo(
    () => tags.map((tag) => ({ value: tag.slug, label: tag.name })),
    [tags],
  );

  const navigate = useCallback(
    (next: Partial<EntriesFilter>) => {
      const merged = { ...currentFilter, ...next, page: 1 };
      const sp = filterToSearchParams(merged);
      router.push(sp ? `/admin/entries?${sp}` : "/admin/entries");
      router.refresh();
    },
    [currentFilter, router],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if ((currentFilter.q ?? "") !== q) navigate({ q: q || undefined });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, currentFilter.q, navigate]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[220px] flex-1">
        <Input
          placeholder="搜索标题…"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
      </div>
      <Select
        value={statusValue}
        onValueChange={(value) =>
          navigate({ status: value === ALL_VALUE ? undefined : (value as EntriesFilter["status"]) })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>全部状态</SelectItem>
          <SelectItem value="DRAFT">草稿</SelectItem>
          <SelectItem value="PUBLISHED">已发布</SelectItem>
          <SelectItem value="ARCHIVED">已归档</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={channelValue}
        onValueChange={(value) =>
          navigate({ channelId: value === ALL_VALUE ? undefined : value })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="频道" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>全部频道</SelectItem>
          {columns.map((column) => (
            <SelectItem key={column.id} value={column.id}>
              {column.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={tagValue}
        onValueChange={(value) =>
          navigate({ tag: value === ALL_VALUE ? undefined : value })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="标签" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>全部标签</SelectItem>
          {tagOptions.map((tag) => (
            <SelectItem key={tag.value} value={tag.value}>
              {tag.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasActiveFilter ? (
        <Button
          variant="outline"
          onClick={() => {
            setQ("");
            router.push("/admin/entries");
            router.refresh();
          }}
        >
          重置
        </Button>
      ) : null}
    </div>
  );
}

export function filterToSearchParams(filter: EntriesFilter): string {
  const params = new URLSearchParams();
  if (filter.page && filter.page !== 1) params.set("page", String(filter.page));
  if (filter.pageSize && filter.pageSize !== 20) {
    params.set("pageSize", String(filter.pageSize));
  }
  if (filter.status) params.set("status", filter.status);
  if (filter.channelId) params.set("channelId", filter.channelId);
  if (filter.tag) params.set("tag", filter.tag);
  if (filter.q) params.set("q", filter.q);
  return params.toString();
}
