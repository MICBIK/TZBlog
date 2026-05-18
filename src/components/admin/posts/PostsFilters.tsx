"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PostsFilter {
  page: number;
  pageSize: number;
  status?: string;
  columnId?: string;
  tag?: string;
  q?: string;
}

export interface PostsFiltersProps {
  currentFilter: PostsFilter;
  columns: Array<{ id: string; name: string }>;
  tags: Array<{ slug: string; name: string }>;
}

const ALL_VALUE = "__all__";

export function PostsFilters({
  currentFilter,
  columns,
  tags,
}: PostsFiltersProps) {
  const router = useRouter();

  const [q, setQ] = useState<string>(currentFilter.q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushedQ = useRef<string>(currentFilter.q ?? "");

  // 当 URL 上的 q 变化（外部源），同步本地输入
  useEffect(() => {
    const next = currentFilter.q ?? "";
    if (next !== lastPushedQ.current) {
      setQ(next);
      lastPushedQ.current = next;
    }
  }, [currentFilter.q]);

  // 输入 debounce 推 URL
  useEffect(() => {
    if (q === lastPushedQ.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastPushedQ.current = q;
      pushFilter({ q: q || undefined, page: 1 });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function pushFilter(partial: Partial<PostsFilter>) {
    const merged: PostsFilter = {
      ...currentFilter,
      ...partial,
      // 任一 filter 切换 → page 重置为 1（除非 partial 显式给了 page）
      page: partial.page ?? 1,
    };
    const sp = filterToSearchParams(merged);
    router.push(sp ? `/admin/posts?${sp}` : "/admin/posts");
    router.refresh();
  }

  function reset() {
    setQ("");
    lastPushedQ.current = "";
    router.push("/admin/posts");
    router.refresh();
  }

  const statusValue = currentFilter.status ?? ALL_VALUE;
  const columnValue = currentFilter.columnId ?? ALL_VALUE;
  const tagValue = currentFilter.tag ?? ALL_VALUE;

  const sortedTags = useMemo(
    () => [...tags].sort((a, b) => a.name.localeCompare(b.name)),
    [tags],
  );

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-3">
      <div className="min-w-[220px] flex-1">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索标题或摘要"
          aria-label="搜索文章"
        />
      </div>

      <div className="w-[140px]">
        <Select
          value={statusValue}
          onValueChange={(v) =>
            pushFilter({ status: v === ALL_VALUE ? undefined : v })
          }
        >
          <SelectTrigger aria-label="状态筛选">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>全部状态</SelectItem>
            <SelectItem value="DRAFT">草稿</SelectItem>
            <SelectItem value="PUBLISHED">已发布</SelectItem>
            <SelectItem value="ARCHIVED">已归档</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-[180px]">
        <Select
          value={columnValue}
          onValueChange={(v) =>
            pushFilter({ columnId: v === ALL_VALUE ? undefined : v })
          }
        >
          <SelectTrigger aria-label="专栏筛选">
            <SelectValue placeholder="专栏" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>全部专栏</SelectItem>
            {columns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[180px]">
        <Select
          value={tagValue}
          onValueChange={(v) =>
            pushFilter({ tag: v === ALL_VALUE ? undefined : v })
          }
        >
          <SelectTrigger aria-label="标签筛选">
            <SelectValue placeholder="标签" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>全部标签</SelectItem>
            {sortedTags.map((t) => (
              <SelectItem key={t.slug} value={t.slug}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="ghost" onClick={reset} className="text-muted-foreground">
        重置
      </Button>
    </div>
  );
}

export function filterToSearchParams(filter: PostsFilter): string {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.status) params.set("status", filter.status);
  if (filter.columnId) params.set("columnId", filter.columnId);
  if (filter.tag) params.set("tag", filter.tag);
  if (filter.page && filter.page > 1) params.set("page", String(filter.page));
  if (filter.pageSize && filter.pageSize !== 20) {
    params.set("pageSize", String(filter.pageSize));
  }
  return params.toString();
}
