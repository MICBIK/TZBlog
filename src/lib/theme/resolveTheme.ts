import type { ChannelKind, ChannelLayout } from "@prisma/client";

export type ThemeName = "aurora" | "ink" | "terminal" | "admin";

export interface ChannelThemeInput {
  kind: ChannelKind;
  layout: ChannelLayout;
}

export function resolveChannelTheme(channel: ChannelThemeInput): Exclude<ThemeName, "admin"> {
  if (channel.kind === "STREAM") {
    return "terminal";
  }
  return "aurora";
}
