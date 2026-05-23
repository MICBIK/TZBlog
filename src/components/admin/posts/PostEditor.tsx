"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditorWithPreview } from "@/components/editor/MarkdownEditorWithPreview";

import { PostMetaSidebar, type PostMeta } from "./PostMetaSidebar";

export type PostEditorMode = "create" | "edit";

export interface PostEditorInitial {
  id: string;
  slug: string;
  cover: string | null;
  status: PostMeta["status"];
  publishedAt: string | null;
  columnId: string | null;
  tags: string[];
  title: string;
  excerpt: string;
  content: string;
}

export interface PostEditorProps {
  mode: PostEditorMode;
  initial?: PostEditorInitial;
  columns: Array<{ id: string; name: string }>;
  allTags: Array<{ slug: string; name: string }>;
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type TargetStatus = PostMeta["status"];

type SubmitPayload = {
  slug: string;
  cover: string | null;
  status: TargetStatus;
  publishedAt: string | null;
  columnId: string | null;
  tags: string[];
  translations: Array<{
    locale: "zh";
    title: string;
    excerpt: string | null;
    content: string;
  }>;
};

type ApiError = {
  error?: { code?: string; message?: string };
};

/**
 * Full-screen post editor.
 *
 * Layout: sticky toolbar with breadcrumb + save / publish actions, then a
 * two-column body (large title + Tiptap on the left, metadata sidebar on the
 * right). Status is never set from the sidebar — the action button decides
 * which status to send (DRAFT / PUBLISHED / ARCHIVED), so a single click never
 * silently changes both content and visibility.
 */
export function PostEditor({
  mode,
  initial,
  columns,
  allTags,
}: PostEditorProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = React.useState(initial?.excerpt ?? "");
  const [content, setContent] = React.useState(initial?.content ?? "");
  const [meta, setMeta] = React.useState<PostMeta>({
    slug: initial?.slug ?? "",
    cover: initial?.cover ?? "",
    status: initial?.status ?? "DRAFT",
    publishedAt: initial?.publishedAt ?? "",
    columnId: initial?.columnId ?? null,
    tags: initial?.tags ?? [],
  });

  const [submitting, setSubmitting] = React.useState<TargetStatus | null>(null);

  const validate = (): string | null => {
    if (!title.trim()) return "标题不能为空";
    if (!meta.slug.trim()) return "slug 不能为空";
    if (!SLUG_REGEX.test(meta.slug)) {
      return "slug 只能包含小写字母、数字和连字符";
    }
    return null;
  };

  const submit = async (targetStatus: TargetStatus) => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const payload: SubmitPayload = {
      slug: meta.slug.trim(),
      cover: meta.cover.trim() ? meta.cover.trim() : null,
      status: targetStatus,
      publishedAt: meta.publishedAt ? meta.publishedAt : null,
      columnId: meta.columnId ?? null,
      tags: meta.tags,
      translations: [
        {
          locale: "zh",
          title: title.trim(),
          excerpt: excerpt.trim() ? excerpt.trim() : null,
          content,
        },
      ],
    };

    const url =
      mode === "create"
        ? "/api/admin/posts"
        : `/api/admin/posts/${initial!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    setSubmitting(targetStatus);
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      setSubmitting(null);
      toast.error("网络异常，请稍后再试");
      return;
    }

    if (!res.ok) {
      let body: ApiError | null = null;
      try {
        body = (await res.json()) as ApiError;
      } catch {
        body = null;
      }
      setSubmitting(null);
      if (body?.error?.code === "CONFLICT") {
        toast.error("slug 已被使用");
        return;
      }
      toast.error(body?.error?.message ?? "保存失败");
      return;
    }

    let data: { id?: string } | null = null;
    try {
      const parsed = (await res.json()) as { data?: { id?: string } };
      data = parsed?.data ?? null;
    } catch {
      data = null;
    }

    setSubmitting(null);
    setMeta((prev) => ({ ...prev, status: targetStatus }));

    toast.success(
      targetStatus === "DRAFT"
        ? "已保存草稿"
        : targetStatus === "PUBLISHED"
          ? "已发布"
          : "已归档",
    );

    if (mode === "create" && data?.id) {
      router.push(`/admin/posts/${data.id}/edit`);
    } else {
      router.refresh();
    }
  };

  const isEdit = mode === "edit";
  const busy = submitting !== null;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="sticky top-0 z-20 -mx-6 flex items-center justify-between gap-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))] px-6 py-3">
        <nav className="text-sm text-[hsl(var(--muted))]">
          <Link
            href="/admin/posts"
            className="transition-colors hover:text-[hsl(var(--fg))]"
          >
            文章
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[hsl(var(--fg))]">
            {isEdit ? "编辑" : "新建"}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => submit("DRAFT")}
          >
            {submitting === "DRAFT" ? "保存中..." : "保存草稿"}
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => submit("PUBLISHED")}
          >
            {submitting === "PUBLISHED" ? "发布中..." : "发布"}
          </Button>
          {isEdit ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" disabled={busy}>
                  更多
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    submit("ARCHIVED");
                  }}
                >
                  归档
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题"
            aria-label="文章标题"
            className="h-16 border-0 px-0 text-3xl font-semibold shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="一句话简介，会出现在列表 / OG / RSS"
            aria-label="文章简介"
            className="resize-none"
          />
          <div className="min-h-[32rem]">
            <MarkdownEditorWithPreview
              value={content}
              onChange={setContent}
              onSave={() => submit("DRAFT")}
              placeholder="开始写作..."
            />
          </div>
        </div>

        <PostMetaSidebar
          meta={meta}
          setMeta={setMeta}
          columns={columns}
          allTags={allTags}
        />
      </div>
    </div>
  );
}

export default PostEditor;
