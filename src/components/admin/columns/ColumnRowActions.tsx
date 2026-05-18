"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ColumnRowActionsColumn {
  id: string;
  slug: string;
}

export interface ColumnRowActionsProps {
  column: ColumnRowActionsColumn;
  onEdit: () => void;
  onDelete: () => void;
}

export function ColumnRowActions({
  column,
  onEdit,
  onDelete,
}: ColumnRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`操作 ${column.slug}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onSelect={(e) => handleSelect(e, onEdit)}>
          <Pencil className="h-4 w-4" />
          <span>编辑</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(e) => handleSelect(e, onDelete)}
        >
          <Trash2 className="h-4 w-4" />
          <span>删除</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type SelectEvent = Parameters<
  NonNullable<ComponentProps<typeof DropdownMenuItem>["onSelect"]>
>[0];

function handleSelect(e: SelectEvent, fn: () => void) {
  // 阻止默认行为只是为了避免菜单内焦点漂移；fn 自己处理后续 UI（dialog/confirm）
  e.preventDefault();
  fn();
}
