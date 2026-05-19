"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CoverUploader } from "./CoverUploader";
import { TagsInput } from "./TagsInput";

export type PostMeta = {
  slug: string;
  cover: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string;
  columnId: string | null;
  tags: string[];
};

export interface PostMetaSidebarProps {
  meta: PostMeta;
  setMeta: (next: PostMeta) => void;
  columns: Array<{ id: string; name: string }>;
  allTags: Array<{ slug: string; name: string }>;
}

const STATUS_LABEL: Record<PostMeta["status"], string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档",
};

const STATUS_VARIANT: Record<
  PostMeta["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline",
};

const NO_COLUMN_VALUE = "__none__";

/**
 * Right-hand sidebar for the post editor: surfaces all non-content metadata
 * (slug, column, tags, cover, scheduled time) and the read-only status badge.
 *
 * Status itself is mutated by the top-of-page action buttons in `PostEditor`
 * (保存草稿 / 发布 / 归档) — exposing it as a Select here would let drafts and
 * publishes diverge from the action the user clicked.
 */
export function PostMetaSidebar({
  meta,
  setMeta,
  columns,
  allTags,
}: PostMetaSidebarProps) {
  const update = <K extends keyof PostMeta>(key: K, value: PostMeta[K]) => {
    setMeta({ ...meta, [key]: value });
  };

  return (
    <aside className="flex flex-col gap-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-5">
      <section className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-[hsl(var(--muted))]">
          状态
        </Label>
        <div>
          <Badge variant={STATUS_VARIANT[meta.status]}>
            {STATUS_LABEL[meta.status]}
          </Badge>
        </div>
        <p className="text-xs text-[hsl(var(--muted))]">
          状态由顶部按钮决定：保存草稿 / 发布 / 归档。
        </p>
      </section>

      <Separator />

      <section className="space-y-2">
        <Label htmlFor="post-slug">slug</Label>
        <Input
          id="post-slug"
          value={meta.slug}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => update("slug", e.target.value)}
          placeholder="my-first-post"
        />
        <p className="text-xs text-[hsl(var(--muted))]">
          仅能包含小写字母、数字和连字符。
        </p>
      </section>

      <Separator />

      <section className="space-y-2">
        <Label htmlFor="post-column">专栏</Label>
        <Select
          value={meta.columnId ?? NO_COLUMN_VALUE}
          onValueChange={(v) =>
            update("columnId", v === NO_COLUMN_VALUE ? null : v)
          }
        >
          <SelectTrigger id="post-column">
            <SelectValue placeholder="选择专栏" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_COLUMN_VALUE}>无</SelectItem>
            {columns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-[hsl(var(--muted))]">
          可选。文章会出现在所选专栏下。
        </p>
      </section>

      <Separator />

      <section className="space-y-2">
        <Label>标签</Label>
        <TagsInput
          value={meta.tags}
          onChange={(next) => update("tags", next)}
          suggestions={allTags}
        />
        <p className="text-xs text-[hsl(var(--muted))]">
          回车或逗号确认。已存在的标签会被复用。
        </p>
      </section>

      <Separator />

      <section className="space-y-2">
        <Label>封面</Label>
        <CoverUploader
          value={meta.cover || null}
          onChange={(url) => update("cover", url ?? "")}
        />
        <p className="text-xs text-[hsl(var(--muted))]">
          可选。出现在列表卡片和 OG 图。
        </p>
      </section>

      {meta.status === "PUBLISHED" ? (
        <>
          <Separator />
          <section className="space-y-2">
            <Label htmlFor="post-published-at">发布时间</Label>
            <Input
              id="post-published-at"
              type="datetime-local"
              value={toLocalDatetime(meta.publishedAt)}
              onChange={(e) =>
                update("publishedAt", fromLocalDatetime(e.target.value))
              }
            />
            <p className="text-xs text-[hsl(var(--muted))]">
              留空则使用首次发布时间。
            </p>
          </section>
        </>
      ) : null}
    </aside>
  );
}

/** ISO -> "yyyy-MM-ddTHH:mm" expected by <input type="datetime-local"> */
function toLocalDatetime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "yyyy-MM-ddTHH:mm" (local) -> ISO string in UTC */
function fromLocalDatetime(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export default PostMetaSidebar;
