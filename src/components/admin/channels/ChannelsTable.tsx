"use client";

import * as React from "react";
import { toast } from "sonner";

export interface ChannelRow {
  id: string;
  order: number;
  slug: string;
  kind: string;
  layout: string;
  enabled: boolean;
  entryCount: number;
}

export function ChannelsTable({ initialChannels }: { initialChannels: ChannelRow[] }) {
  const [channels, setChannels] = React.useState<ChannelRow[]>(() =>
    [...initialChannels].sort((a, b) => a.order - b.order),
  );

  async function handleMove(id: string, direction: "up" | "down") {
    const currentIndex = channels.findIndex((channel) => channel.id === id);
    if (currentIndex === -1) return;

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= channels.length) return;

    const previous = channels;
    const next = [...channels];
    [next[currentIndex], next[swapIndex]] = [next[swapIndex], next[currentIndex]];
    setChannels(next);

    try {
      const response = await fetch("/api/admin/channels/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((channel) => channel.id) }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setChannels(previous);
      toast.error("频道排序失败", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/30">
          <tr>
            <th className="px-3 py-2 text-left font-medium">排序</th>
            <th className="px-3 py-2 text-left font-medium">slug</th>
            <th className="px-3 py-2 text-left font-medium">kind</th>
            <th className="px-3 py-2 text-left font-medium">layout</th>
            <th className="px-3 py-2 text-left font-medium">entries</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((channel, index) => (
            <tr
              key={channel.id}
              data-testid="channel-row"
              data-slug={channel.slug}
              className="border-t border-border"
            >
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`上移 ${channel.slug}`}
                    disabled={index === 0}
                    onClick={() => {
                      void handleMove(channel.id, "up");
                    }}
                    className="rounded border border-border px-2 py-1 disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`下移 ${channel.slug}`}
                    disabled={index === channels.length - 1}
                    onClick={() => {
                      void handleMove(channel.id, "down");
                    }}
                    className="rounded border border-border px-2 py-1 disabled:opacity-40"
                  >
                    ↓
                  </button>
                </div>
              </td>
              <td className="px-3 py-2 font-mono">{channel.slug}</td>
              <td className="px-3 py-2">{channel.kind}</td>
              <td className="px-3 py-2">{channel.layout}</td>
              <td className="px-3 py-2">{channel.entryCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ChannelsTable;
