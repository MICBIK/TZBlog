import { z } from "zod";

import { SUPPORTED_LOCALES } from "@/lib/i18n";

const localeEnum = z.enum(SUPPORTED_LOCALES as unknown as [string, ...string[]]);
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const channelKindEnum = z.enum([
  "ARTICLES",
  "NOTES",
  "LINKS",
  "STREAM",
  "GUESTBOOK",
  "CUSTOM",
]);
const channelLayoutEnum = z.enum([
  "CHRONICLE",
  "CARDS",
  "TIMELINE",
  "GREP",
  "FEED",
]);

export const channelTranslationInputSchema = z.object({
  locale: localeEnum,
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
});

export const createChannelSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(slugRegex, "slug 只能包含小写字母、数字和连字符"),
  kind: channelKindEnum,
  layout: channelLayoutEnum,
  enabled: z.boolean().default(true),
  translations: z.array(channelTranslationInputSchema).min(1),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;

export const updateChannelSchema = createChannelSchema.partial();

export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
