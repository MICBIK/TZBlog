import path from "node:path";

export const CHANNEL_LAYOUT_SMOKE_DIR = path.join(
  process.cwd(),
  ".claude/sdd/blog-ia-redesign/smoke/channel-layouts",
);

export const CHANNEL_LAYOUT_MATRIX = [
  { layout: "chronicle", slug: "articles", demo: "ink-garden" },
  { layout: "cards", slug: "cards", demo: "aurora-portal" },
  { layout: "timeline", slug: "notes", demo: "aurora-portal" },
  { layout: "grep", slug: "stream", demo: "terminal-workshop" },
  { layout: "feed", slug: "pulse", demo: "terminal-workshop" },
] as const;

export const CHANNEL_THEME_NAMES = ["aurora", "ink", "terminal"] as const;

export type ChannelThemeName = (typeof CHANNEL_THEME_NAMES)[number];

export function screenshotPath(
  layout: string,
  theme: ChannelThemeName,
  viewport: "desktop" | "mobile",
): string {
  return path.join(
    CHANNEL_LAYOUT_SMOKE_DIR,
    `${layout}-${theme}-${viewport}.png`,
  );
}
