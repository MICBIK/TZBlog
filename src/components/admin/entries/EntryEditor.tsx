"use client";

import * as React from "react";
import type { ChannelKind, EntryKind } from "@prisma/client";

import { MilkdownEditor } from "@/components/editor/MilkdownEditor";
import { getAllowedEntryKindsForChannelKind } from "@/lib/schemas/channelEntryRules";

export interface EntryEditorChannel {
  id: string;
  slug: string;
  kind: ChannelKind;
  name: string;
}

export interface EntryEditorProps {
  channels: EntryEditorChannel[];
  initialChannelId?: string;
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

function getSelectedChannel(
  channels: EntryEditorChannel[],
  channelId?: string,
): EntryEditorChannel | null {
  return channels.find((channel) => channel.id === channelId) ?? channels[0] ?? null;
}

export function EntryEditor({
  channels,
  initialChannelId,
}: EntryEditorProps) {
  const initialChannel = getSelectedChannel(channels, initialChannelId);
  const [channelId, setChannelId] = React.useState(initialChannel?.id ?? "");
  const selectedChannel = getSelectedChannel(channels, channelId);
  const allowedKinds = selectedChannel
    ? getAllowedEntryKindsForChannelKind(selectedChannel.kind)
    : [];
  const [kind, setKind] = React.useState<EntryKind>(allowedKinds[0] ?? "ARTICLE");
  const [body, setBody] = React.useState("");
  const [articleMetadata, setArticleMetadata] = React.useState<ArticleMetadataDraft>({
    cover: "",
    readingMinutes: "",
    toc: true,
    ogImage: "",
  });
  const [linkMetadata, setLinkMetadata] = React.useState<LinkMetadataDraft>({
    sourceUrl: "",
    sourceTitle: "",
    sourceAuthor: "",
    thumbnail: "",
  });
  const [hotTakeMetadata, setHotTakeMetadata] = React.useState<HotTakeMetadataDraft>({
    sourcePlatform: "twitter",
    sourceUrl: "",
    sourceSnippet: "",
  });

  if (!selectedChannel) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-fg">
        暂无可用频道，无法创建条目。
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">新建条目</h1>
        <p className="text-sm text-muted-fg">
          先选频道，再按 Channel.kind 自动约束可创建的 Entry.kind。
        </p>
      </header>

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

      <MilkdownEditor value={body} onChange={setBody} />
    </div>
  );
}

export default EntryEditor;
