import type { ChannelKind, ChannelLayout, EntryKind } from "@prisma/client"

const ENTRY_KINDS_BY_CHANNEL_KIND = {
  ARTICLES: ["ARTICLE"],
  NOTES: ["NOTE", "QUOTE", "LINK"],
  LINKS: ["LINK"],
  STREAM: ["NOTE", "JOKE", "HOT_TAKE", "QUOTE", "LINK", "REVIEW"],
  GUESTBOOK: ["GUESTBOOK_THREAD"],
  CUSTOM: [
    "ARTICLE",
    "NOTE",
    "LINK",
    "JOKE",
    "HOT_TAKE",
    "REVIEW",
    "QUOTE",
    "GUESTBOOK_THREAD",
  ],
} as const satisfies Record<ChannelKind, readonly EntryKind[]>

const LAYOUTS_BY_CHANNEL_KIND = {
  ARTICLES: ["CHRONICLE", "CARDS"],
  NOTES: ["TIMELINE", "FEED"],
  LINKS: ["CHRONICLE", "CARDS"],
  STREAM: ["TIMELINE", "FEED", "GREP"],
  GUESTBOOK: ["FEED"],
  CUSTOM: ["CHRONICLE", "CARDS", "TIMELINE", "GREP", "FEED"],
} as const satisfies Record<ChannelKind, readonly ChannelLayout[]>

export function getAllowedEntryKindsForChannelKind(
  kind: ChannelKind,
): readonly EntryKind[] {
  return ENTRY_KINDS_BY_CHANNEL_KIND[kind]
}

export function getAllowedLayoutsForChannelKind(
  kind: ChannelKind,
): readonly ChannelLayout[] {
  return LAYOUTS_BY_CHANNEL_KIND[kind]
}

export function isEntryKindAllowedForChannelKind(
  channelKind: ChannelKind,
  entryKind: EntryKind,
): boolean {
  return getAllowedEntryKindsForChannelKind(channelKind).includes(entryKind)
}

export function isLayoutAllowedForChannelKind(
  channelKind: ChannelKind,
  layout: ChannelLayout,
): boolean {
  return getAllowedLayoutsForChannelKind(channelKind).includes(layout)
}
