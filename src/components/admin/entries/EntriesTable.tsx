"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import type { EntryStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntryRowActions } from "@/components/admin/entries/EntryRowActions";
import {
  filterToSearchParams,
  type EntriesFilter,
} from "@/components/admin/entries/EntriesFilters";
import type { ArticleListItem } from "@/lib/services/articles";

export interface EntriesTableProps {
  initialItems: ArticleListItem[];
  total: number;
  page: number;
  pageSize: number;
  currentFilter: EntriesFilter;
}

const STATUS_LABEL: Record<EntryStatus, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档",
};

const STATUS_VARIANT: Record<
  EntryStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline",
};

export function EntriesTable({
  initialItems,
  total,
  page,
  pageSize,
  currentFilter,
}: EntriesTableProps) {
  const router = useRouter();
  const [items, setItems] = useState<ArticleListItem[]>(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ArticleListItem | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  function goToPage(nextPage: number) {
    const sp = filterToSearchParams({ ...currentFilter, page: nextPage });
    router.push(sp ? `/admin/entries?${sp}` : "/admin/entries");
    router.refresh();
  }

  async function confirmDelete() {
    const entry = pendingDelete;
    if (!entry) return;
    setPendingDelete(null);

    setPendingId(entry.id);
    try {
      const res = await fetch(`/api/admin/entries/${entry.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.filter((p) => p.id !== entry.id));
      toast.success(`已删除「${entry.title}」`);
    } catch (err) {
      toast.error("删除失败", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPendingId(null);
    }
  }

  async function handlePublishToggle(entry: ArticleListItem) {
    const nextStatus: EntryStatus =
      entry.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const previous = items;
    setPendingId(entry.id);
    setItems((prev) =>
      prev.map((p) => (p.id === entry.id ? { ...p, status: nextStatus } : p)),
    );

    try {
      const res = await fetch(`/api/admin/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(
        nextStatus === "PUBLISHED"
          ? `已发布「${entry.title}」`
          : `已撤回「${entry.title}」为草稿`,
      );
    } catch (err) {
      setItems(previous); // 回滚
      toast.error("操作失败", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table className="admin-table">
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead className="w-[140px]">频道</TableHead>
              <TableHead className="w-[100px]">状态</TableHead>
              <TableHead className="w-[200px]">标签</TableHead>
              <TableHead className="w-[80px] text-right">浏览</TableHead>
              <TableHead className="w-[120px]">创建时间</TableHead>
              <TableHead className="w-[64px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="p-0"
                >
                  <EmptyState
                    title="暂无条目 · 点击「新建条目」开始创建"
                    action={{ label: "新建条目", href: "/admin/entries/new" }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={pendingId === row.id ? "selected" : undefined}
                >
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-fg">{row.title}</span>
                      {row.excerpt ? (
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {row.excerpt}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.channelName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[row.status]}>
                      {STATUS_LABEL[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      {row.tags.slice(0, 3).map((t) => (
                        <Badge
                          key={t.slug}
                          variant="outline"
                          className="font-mono text-xs"
                        >
                          {t.name}
                        </Badge>
                      ))}
                      {row.tags.length > 3 ? (
                        <span className="text-xs text-muted-foreground">
                          +{row.tags.length - 3}
                        </span>
                      ) : null}
                      {row.tags.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-sm">
                    {row.viewCount}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(row.createdAt), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-right">
                    <EntryRowActions
                      entry={{
                        id: row.id,
                        slug: row.slug,
                        status: row.status,
                      }}
                      onPublishToggle={() => handlePublishToggle(row)}
                      onDelete={() => setPendingDelete(row)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          共 {total} 条 · 第 {page} / {totalPages} 页
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => goToPage(page - 1)}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => goToPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除条目</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `将删除条目「${pendingDelete.title}」。级联删除：所有评论 / 点赞 / 浏览记录 / 标签关联 / 翻译。该操作不可恢复。`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
