import type { EntryKind } from "@prisma/client";

export type ChannelLayoutEntry = {
  id: string;
  slug: string;
  kind: EntryKind;
  publishedAt: Date | null;
  title: string;
  excerpt?: string | null;
  metadata: unknown;
};

export type ChannelLayoutProps = {
  channelSlug: string;
  entries: ChannelLayoutEntry[];
};
