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

      <MilkdownEditor value={body} onChange={setBody} />
    </div>
  );
}

export default EntryEditor;
