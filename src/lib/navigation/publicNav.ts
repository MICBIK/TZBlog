import type { ChannelKind } from "@prisma/client";

export type HeaderChannel = {
  slug: string;
  kind: ChannelKind;
  enabled: boolean;
  order: number;
  translations: ReadonlyArray<{ locale: string; name: string }>;
};
