import type { ChannelKind, ChannelLayout, EntryKind } from "@prisma/client";

export type ThemeName = "aurora" | "ink" | "terminal" | "admin";

export interface ChannelThemeInput {
  kind: ChannelKind;
  layout: ChannelLayout;
}

export interface EntryThemeInput {
  kind: EntryKind;
}

export function resolveChannelTheme(
  channel: ChannelThemeInput,
): Exclude<ThemeName, "admin"> {
  if (channel.kind === "STREAM") {
    return "terminal";
  }

  if (channel.layout === "GREP") {
    return "terminal";
  }

  if (channel.layout === "TIMELINE" || channel.layout === "FEED") {
    return "aurora";
  }

  return "aurora";
}

export function resolveEntryTheme(
  entry: EntryThemeInput,
  channel: ChannelThemeInput,
): Exclude<ThemeName, "admin"> {
  if (entry.kind === "ARTICLE") {
    return "ink";
  }

  return resolveChannelTheme(channel);
}

export const DEFAULT_SITE_THEME: Exclude<ThemeName, "admin"> = "aurora";
