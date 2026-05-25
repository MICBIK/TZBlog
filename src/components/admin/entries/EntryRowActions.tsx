"use client";

import Link from "next/link";
import {
  Eye,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import type { ComponentProps } from "react";
import type { EntryStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface EntryRowActionsEntry {
  id: string;
  slug: string;
  status: EntryStatus;
}

export interface EntryRowActionsProps {
  entry: EntryRowActionsEntry;
  onPublishToggle: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}

export function EntryRowActions({
  entry,
  onPublishToggle,
  onDelete,
}: EntryRowActionsProps) {
  const isPublished = entry.status === "PUBLISHED";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`操作 ${entry.slug}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem asChild>
          <Link
            href={`/admin/entries/${entry.id}/edit`}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            <span>编辑</span>
          </Link>
        </DropdownMenuItem>
        {isPublished ? (
          <DropdownMenuItem asChild>
            <Link
              href={`/posts/${entry.slug}`}
              className="flex items-center gap-2"
              target="_blank"
              rel="noreferrer"
            >
              <Eye className="h-4 w-4" />
              <span>在前台查看</span>
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => handleSelect(e, onPublishToggle)}>
          {isPublished ? (
            <>
              <Undo2 className="h-4 w-4" />
              <span>取消发布</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>发布</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
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

function handleSelect(e: SelectEvent, fn: () => void | Promise<void>) {
  e.preventDefault();
  void fn();
}
