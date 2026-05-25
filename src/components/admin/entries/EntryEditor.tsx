"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ChannelKind, EntryKind } from "@prisma/client";

import { TagsInput } from "@/components/admin/posts/TagsInput";
import { MilkdownEditor } from "@/components/editor/MilkdownEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAllowedEntryKindsForChannelKind } from "@/lib/schemas/channelEntryRules";

export interface EntryEditorChannel {
  id: string;
  slug: string;
  kind: ChannelKind;
  name: string;
}

export interface EntryEditorInitial {
  id: string;
  slug: string;
  channelId: string;
  kind: EntryKind;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  seriesId?: string | null;
  seriesOrder?: number | null;
  metadata: Record<string, unknown>;
}

export interface EntryEditorProps {
  channels: EntryEditorChannel[];
  initialChannelId?: string;
  mode?: "create" | "edit";
  seriesOptions?: Array<{ id: string; name: string; channelId: string }>;
  allTags?: Array<{ slug: string; name: string }>;
  initial?: EntryEditorInitial;
}

interface ArticleMetadataDraft {
  cover: string;
  readingMinutes: string;
  toc: boolean;
  ogImage: string;
}

interface LinkMetadataDraft {
  sourceUrl: string;
  sourceTitle: string;
  sourceAuthor: string;
  thumbnail: string;
}

interface HotTakeMetadataDraft {
  sourcePlatform: string;
  sourceUrl: string;
  sourceSnippet: string;
}

type FieldErrors = Record<string, string>;

function getSelectedChannel(
  channels: EntryEditorChannel[],
  channelId?: string,
): EntryEditorChannel | null {
  return channels.find((channel) => channel.id === channelId) ?? channels[0] ?? null;
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readArticleMetadataDraft(
  raw: Record<string, unknown> | undefined,
): ArticleMetadataDraft {
  return {
    cover: toStringOrEmpty(raw?.cover),
    readingMinutes:
      typeof raw?.readingMinutes === "number" ? String(raw.readingMinutes) : "",
    toc: typeof raw?.toc === "boolean" ? raw.toc : true,
    ogImage: toStringOrEmpty(raw?.ogImage),
  };
}

function readLinkMetadataDraft(
  raw: Record<string, unknown> | undefined,
): LinkMetadataDraft {
  return {
    sourceUrl: toStringOrEmpty(raw?.sourceUrl),
    sourceTitle: toStringOrEmpty(raw?.sourceTitle),
    sourceAuthor: toStringOrEmpty(raw?.sourceAuthor),
    thumbnail: toStringOrEmpty(raw?.thumbnail),
  };
}

function readHotTakeMetadataDraft(
  raw: Record<string, unknown> | undefined,
): HotTakeMetadataDraft {
  return {
    sourcePlatform: toStringOrEmpty(raw?.sourcePlatform) || "twitter",
    sourceUrl: toStringOrEmpty(raw?.sourceUrl),
    sourceSnippet: toStringOrEmpty(raw?.sourceSnippet),
  };
}

export function EntryEditor({
  channels,
  initialChannelId,
  mode = "create",
  seriesOptions = [],
  allTags = [],
  initial,
}: EntryEditorProps) {
  const router = useRouter();
  const initialChannel = getSelectedChannel(
    channels,
    initial?.channelId ?? initialChannelId,
  );
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = React.useState(initial?.excerpt ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [channelId, setChannelId] = React.useState(
    initial?.channelId ?? initialChannel?.id ?? "",
  );
  const selectedChannel = getSelectedChannel(channels, channelId);
  const allowedKinds = selectedChannel
    ? getAllowedEntryKindsForChannelKind(selectedChannel.kind)
    : [];
  const [kind, setKind] = React.useState<EntryKind>(
    initial?.kind ?? allowedKinds[0] ?? "ARTICLE",
  );
  const [seriesId, setSeriesId] = React.useState(initial?.seriesId ?? "");
  const [seriesOrder, setSeriesOrder] = React.useState(
    initial?.seriesOrder ? String(initial.seriesOrder) : "",
  );
  const [tags, setTags] = React.useState<string[]>(initial?.tags ?? []);
  const [body, setBody] = React.useState(initial?.content ?? "");
  const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
    initial?.status ?? "DRAFT",
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [articleMetadata, setArticleMetadata] = React.useState<ArticleMetadataDraft>(
    readArticleMetadataDraft(initial?.metadata),
  );
  const [linkMetadata, setLinkMetadata] = React.useState<LinkMetadataDraft>(
    readLinkMetadataDraft(initial?.metadata),
  );
  const [hotTakeMetadata, setHotTakeMetadata] = React.useState<HotTakeMetadataDraft>(
    readHotTakeMetadataDraft(initial?.metadata),
  );
  const availableSeries = seriesOptions.filter(
    (option) => option.channelId === channelId,
  );

  if (!selectedChannel) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-fg">
        暂无可用频道，无法创建条目。
      </div>
    );
  }

  async function submit(
    targetStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  ) {
    if (!selectedChannel) {
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const response = await fetch(
        mode === "edit" && initial?.id
          ? `/api/admin/entries/${initial.id}`
          : "/api/admin/entries",
        {
          method: mode === "edit" && initial?.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            channelId: selectedChannel.id,
            kind,
            status: targetStatus,
            seriesId: seriesId || null,
            seriesOrder: seriesOrder ? Number(seriesOrder) : null,
            metadata: buildMetadataPayload(
              kind,
              articleMetadata,
              linkMetadata,
              hotTakeMetadata,
            ),
            tags,
            translations: [
              {
                locale: "zh",
                title,
                excerpt: excerpt.trim() ? excerpt.trim() : null,
                content: body,
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: {
            code?: string;
            details?: {
              issues?: Array<{
                path?: Array<string | number>;
                message?: string;
              }>;
            };
          };
        };
        if (payload.error?.code === "VALIDATION_ERROR") {
          const nextErrors: FieldErrors = {};
          for (const issue of payload.error.details?.issues ?? []) {
            const field = issue.path?.at(-1);
            if (typeof field === "string" && issue.message) {
              nextErrors[field] = issue.message;
            }
          }
          setFieldErrors(nextErrors);
        }
        if (payload.error?.code === "CONFLICT") {
          setFieldErrors({ slug: "slug 已被使用" });
        }
        return;
      }

      if (mode === "edit" && initial?.id) {
        setStatus(targetStatus);
        router.refresh();
        return;
      }

      const payload = (await response.json()) as { data?: { id?: string } };
      setStatus(targetStatus);
      if (payload.data?.id) {
        router.push(`/admin/entries/${payload.data.id}/edit`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const heading = mode === "edit" ? "编辑条目" : "新建条目";

  return (
    <div className="grid gap-6">
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-bg px-4 py-3 md:-mx-6 md:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
          <p className="text-sm text-muted-fg">
            先选频道，再按 Channel.kind 自动约束可创建的 Entry.kind。
          </p>
        </header>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void submit("DRAFT")}
            disabled={submitting}
          >
            {submitting ? "保存中..." : "保存草稿"}
          </Button>
          <Button
            type="button"
            onClick={() => void submit("PUBLISHED")}
            disabled={submitting}
          >
            发布
          </Button>
        </div>
      </div>

      <section className="grid gap-4 rounded-lg border border-border p-4">
        <label className="grid gap-2 text-sm font-medium">
          标题
          <Input
            aria-label="标题"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="输入条目标题"
          />
          {fieldErrors.title ? (
            <p className="text-sm text-destructive">{fieldErrors.title}</p>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm font-medium">
          摘要
          <Textarea
            aria-label="摘要"
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            rows={2}
            placeholder="可选摘要"
          />
        </label>
      </section>

      <section className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          频道
          <select
            aria-label="频道"
            value={channelId}
            onChange={(event) => {
              const nextId = event.target.value;
              const nextChannel = getSelectedChannel(channels, nextId);
              setChannelId(nextId);
              if (nextChannel) {
                setKind(getAllowedEntryKindsForChannelKind(nextChannel.kind)[0]);
              }
            }}
            className="rounded border border-border bg-bg px-3 py-2 text-sm"
          >
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          条目类型
          <select
            aria-label="条目类型"
            value={kind}
            onChange={(event) => setKind(event.target.value as EntryKind)}
            className="rounded border border-border bg-bg px-3 py-2 text-sm"
          >
            {allowedKinds.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          slug
          <Input
            aria-label="slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="my-entry"
          />
          {fieldErrors.slug ? (
            <p className="text-sm text-destructive">{fieldErrors.slug}</p>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm font-medium">
          seriesId
          <select
            aria-label="seriesId"
            value={seriesId}
            onChange={(event) => setSeriesId(event.target.value)}
            className="rounded border border-border bg-bg px-3 py-2 text-sm"
          >
            <option value="">无系列</option>
            {availableSeries.map((series) => (
              <option key={series.id} value={series.id}>
                {series.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          seriesOrder
          <Input
            aria-label="seriesOrder"
            value={seriesOrder}
            onChange={(event) => setSeriesOrder(event.target.value)}
            placeholder="1"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          标签
          <TagsInput value={tags} onChange={setTags} suggestions={allTags} />
        </label>
      </section>

      {kind === "ARTICLE" ? (
        <section className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            cover
            <input
              aria-label="cover"
              value={articleMetadata.cover}
              onChange={(event) =>
                setArticleMetadata((current) => ({
                  ...current,
                  cover: event.target.value,
                }))
              }
              className="rounded border border-border bg-bg px-3 py-2 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            readingMinutes
            <input
              aria-label="readingMinutes"
              value={articleMetadata.readingMinutes}
              onChange={(event) =>
                setArticleMetadata((current) => ({
                  ...current,
                  readingMinutes: event.target.value,
                }))
              }
              className="rounded border border-border bg-bg px-3 py-2 text-sm"
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              aria-label="toc"
              type="checkbox"
              checked={articleMetadata.toc}
              onChange={(event) =>
                setArticleMetadata((current) => ({
                  ...current,
                  toc: event.target.checked,
                }))
              }
            />
            toc
          </label>

          <label className="grid gap-2 text-sm font-medium">
            ogImage
            <input
              aria-label="ogImage"
              value={articleMetadata.ogImage}
              onChange={(event) =>
                setArticleMetadata((current) => ({
                  ...current,
                  ogImage: event.target.value,
                }))
              }
              className="rounded border border-border bg-bg px-3 py-2 text-sm"
            />
          </label>
        </section>
      ) : null}

      {kind === "LINK" ? (
        <section className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            sourceUrl
            <input
              aria-label="sourceUrl"
              value={linkMetadata.sourceUrl}
              onChange={(event) =>
                setLinkMetadata((current) => ({
                  ...current,
                  sourceUrl: event.target.value,
                }))
              }
              className="rounded border border-border bg-bg px-3 py-2 text-sm"
            />
            {fieldErrors.sourceUrl ? (
              <p className="text-sm text-destructive">{fieldErrors.sourceUrl}</p>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm font-medium">
            sourceTitle
            <input
              aria-label="sourceTitle"
              value={linkMetadata.sourceTitle}
              onChange={(event) =>
                setLinkMetadata((current) => ({
                  ...current,
                  sourceTitle: event.target.value,
                }))
              }
              className="rounded border border-border bg-bg px-3 py-2 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            sourceAuthor
            <input
              aria-label="sourceAuthor"
              value={linkMetadata.sourceAuthor}
              onChange={(event) =>
                setLinkMetadata((current) => ({
                  ...current,
                  sourceAuthor: event.target.value,
                }))
              }
              className="rounded border border-border bg-bg px-3 py-2 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            thumbnail
            <input
              aria-label="thumbnail"
              value={linkMetadata.thumbnail}
              onChange={(event) =>
                setLinkMetadata((current) => ({
                  ...current,
                  thumbnail: event.target.value,
                }))
              }
              className="rounded border border-border bg-bg px-3 py-2 text-sm"
            />
          </label>
        </section>
      ) : null}

      {kind === "HOT_TAKE" ? (
        <section className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            sourcePlatform
            <select
              aria-label="sourcePlatform"
              value={hotTakeMetadata.sourcePlatform}
              onChange={(event) =>
                setHotTakeMetadata((current) => ({
                  ...current,
                  sourcePlatform: event.target.value,
                }))
              }
              className="rounded border border-border bg-bg px-3 py-2 text-sm"
            >
              {["weibo", "twitter", "aihot", "hackernews", "v2ex", "zhihu"].map(
                (option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            sourceUrl
            <input
              aria-label="sourceUrl"
              value={hotTakeMetadata.sourceUrl}
              onChange={(event) =>
                setHotTakeMetadata((current) => ({
                  ...current,
                  sourceUrl: event.target.value,
                }))
              }
              className="rounded border border-border bg-bg px-3 py-2 text-sm"
            />
            {fieldErrors.sourceUrl ? (
              <p className="text-sm text-destructive">{fieldErrors.sourceUrl}</p>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            sourceSnippet
            <textarea
              aria-label="sourceSnippet"
              value={hotTakeMetadata.sourceSnippet}
              onChange={(event) =>
                setHotTakeMetadata((current) => ({
                  ...current,
                  sourceSnippet: event.target.value,
                }))
              }
              className="min-h-24 rounded border border-border bg-bg px-3 py-2 text-sm"
            />
          </label>
        </section>
      ) : null}

      <MilkdownEditor
        value={body}
        onChange={setBody}
        onSave={() => void submit(status)}
      />
    </div>
  );
}

function buildMetadataPayload(
  kind: EntryKind,
  articleMetadata: ArticleMetadataDraft,
  linkMetadata: LinkMetadataDraft,
  hotTakeMetadata: HotTakeMetadataDraft,
) {
  switch (kind) {
    case "ARTICLE":
      return {
        cover: articleMetadata.cover.trim() ? articleMetadata.cover.trim() : null,
        readingMinutes: articleMetadata.readingMinutes
          ? Number(articleMetadata.readingMinutes)
          : undefined,
        toc: articleMetadata.toc,
        ogImage: articleMetadata.ogImage.trim() ? articleMetadata.ogImage.trim() : null,
      };
    case "LINK":
      return {
        sourceUrl: linkMetadata.sourceUrl,
        sourceTitle: linkMetadata.sourceTitle,
        sourceAuthor: linkMetadata.sourceAuthor || undefined,
        thumbnail: linkMetadata.thumbnail.trim() ? linkMetadata.thumbnail.trim() : null,
      };
    case "HOT_TAKE":
      return {
        sourcePlatform: hotTakeMetadata.sourcePlatform,
        sourceUrl: hotTakeMetadata.sourceUrl,
        sourceSnippet: hotTakeMetadata.sourceSnippet,
      };
    default:
      return {};
  }
}

export default EntryEditor;
