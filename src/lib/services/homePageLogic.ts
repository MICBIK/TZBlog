import type { ChannelKind } from "@prisma/client";

const previewLimitByKind: Partial<Record<ChannelKind, number>> = {
  ARTICLES: 3,
  STREAM: 5,
};

export function previewLimitForKind(kind: ChannelKind): number {
  return previewLimitByKind[kind] ?? 3;
}
