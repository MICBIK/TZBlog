"use client";

import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ColumnFormDialog } from "@/components/admin/columns/ColumnFormDialog";
import { ColumnReorderControls } from "@/components/admin/columns/ColumnReorderControls";
import { ColumnRowActions } from "@/components/admin/columns/ColumnRowActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export interface ColumnRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover: string | null;
  order: number;
  postCount: number;
  createdAt: Date | string;
}

export interface ColumnsTableProps {
  initialColumns: ColumnRow[];
}

export function ColumnsTable({ initialColumns }: ColumnsTableProps) {
  const [columns, setColumns] = useState<ColumnRow[]>(() =>
    [...initialColumns].sort((a, b) => a.order - b.order),
  );
  const [editing, setEditing] = useState<ColumnRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ColumnRow | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const total = columns.length;

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(row: ColumnRow) {
    setEditing(row);
    setEditorOpen(true);
  }

  function handleSuccess(saved: unknown) {
    if (!saved || typeof saved !== "object") return;
    const s = saved as Record<string, unknown>;
    const translations: Array<{
      locale: string;
      name: string;
      description: string | null;
    }> = Array.isArray(s.translations) ? (s.translations as Array<{ locale: string; name: string; description: string | null }>) : [];
    const zh =
      translations.find((t) => t.locale === "zh") ?? translations[0] ?? null;
    const row: ColumnRow = {
      id: String(s.id ?? ""),
      slug: String(s.slug ?? ""),
      cover: s.cover != null ? String(s.cover) : null,
      order: typeof s.order === "number" ? s.order : 0,
      name: zh?.name ?? String(s.slug ?? ""),
      description: zh?.description ?? null,
      postCount: typeof s.postCount === "number" ? s.postCount : 0,
      createdAt: s.createdAt != null ? (s.createdAt as string | Date) : new Date().toISOString(),
    };
    setColumns((prev) => {
      const idx = prev.findIndex((c) => c.id === row.id);
      if (idx === -1) {
        return [...prev, row].sort((a, b) => a.order - b.order);
      }
      const next = [...prev];
      next[idx] = { ...prev[idx], ...row };
      return next.sort((a, b) => a.order - b.order);
    });
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const idx = columns.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= columns.length) return;

    const previous = columns;
    const next = [...columns];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setColumns(next); // 乐观更新
    setReorderingId(id);

    try {
      const res = await fetch("/api/admin/columns/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((c) => c.id) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("排序已更新");
    } catch (err) {
      setColumns(previous); // 回滚
      toast.error("排序失败，已回滚", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setReorderingId(null);
    }
  }

  async function confirmDelete() {
    const target = pendingDelete;
    if (!target) return;
    setPendingDelete(null);

    setPendingDeleteId(target.id);
    try {
      const res = await fetch(`/api/admin/columns/${target.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setColumns((prev) => prev.filter((c) => c.id !== target.id));
      toast.success(`已删除「${target.name}」`);
    } catch (err) {
      toast.error("删除失败", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <ColumnFormDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          initial={
            editing
              ? {
                  id: editing.id,
                  slug: editing.slug,
                  cover: editing.cover,
                  order: editing.order,
                  translations: [
                    {
                      locale: "zh",
                      name: editing.name,
                      description: editing.description,
                    },
                  ],
                }
              : undefined
          }
          onSuccess={(col) => {
            handleSuccess(col);
            setEditorOpen(false);
          }}
          trigger={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              新建专栏
            </Button>
          }
        />
      </div>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">#</TableHead>
              <TableHead className="w-[160px]">slug</TableHead>
              <TableHead>名称</TableHead>
              <TableHead className="w-[100px] text-right">文章数</TableHead>
              <TableHead className="w-[140px]">创建时间</TableHead>
              <TableHead className="w-[80px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  暂无专栏。点击右上角「新建专栏」开始创建。
                </TableCell>
              </TableRow>
            ) : (
              columns.map((row, idx) => (
                <TableRow
                  key={row.id}
                  data-state={pendingDeleteId === row.id ? "selected" : undefined}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <ColumnReorderControls
                        columnId={row.id}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < total - 1}
                        disabled={reorderingId !== null}
                        onMove={(dir: "up" | "down") =>
                          handleMove(row.id, dir)
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {row.slug}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-fg">{row.name}</span>
                      {row.description ? (
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {row.description}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.postCount}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(row.createdAt), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-right">
                    <ColumnRowActions
                      column={row}
                      onEdit={() => openEdit(row)}
                      onDelete={() => setPendingDelete(row)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除专栏</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `将删除专栏「${pendingDelete.name}」。级联删除：所有翻译。如该专栏下有文章，删除可能失败（请先迁移文章）。该操作不可恢复。`
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
