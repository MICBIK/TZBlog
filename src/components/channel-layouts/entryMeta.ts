import type { EntryKind } from "@prisma/client";

export function entryHref(
  channelSlug: string,
  entrySlug: string,
  kind: EntryKind,
): string {
  if (kind === "ARTICLE" || kind === "REVIEW") {
    return `/posts/${entrySlug}`;
  }

  return `/c/${channelSlug}/${entrySlug}`;
}

export function readEntryCover(
  metadata: unknown,
  kind: EntryKind,
): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = metadata as Record<string, unknown>;

  if (kind === "LINK" && typeof value.thumbnail === "string") {
    return value.thumbnail;
  }

  if (typeof value.cover === "string" && value.cover.trim()) {
    return value.cover;
  }

  return null;
}

export function readReadingMinutes(metadata: unknown): number | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const value = metadata as Record<string, unknown>;
  return typeof value.readingMinutes === "number"
    ? value.readingMinutes
    : undefined;
}

export function estimateReadingMinutes(
  title: string,
  excerpt?: string | null,
): number {
  const text = `${title} ${excerpt ?? ""}`.trim();
  if (!text) return 1;

  const cjkCount = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latinWordCount = (
    text.replace(/[\u3400-\u9fff]/g, " ").match(/\b\w+\b/g) ?? []
  ).length;
  const estimatedWords = cjkCount + latinWordCount;

  return Math.max(1, Math.ceil(estimatedWords / 500));
}
