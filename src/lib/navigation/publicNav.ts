import type { ChannelKind } from "@prisma/client";

export type HeaderChannel = {
  slug: string;
  kind: ChannelKind;
  enabled: boolean;
  order: number;
  translations: ReadonlyArray<{ locale: string; name: string }>;
};

export type HeaderNavLink = {
  href: string;
  label: string;
};

const DEFAULT_LOCALE = "zh";

export function getChannelNavLabel(
  channel: HeaderChannel,
  locale: string = DEFAULT_LOCALE,
): string {
  return (
    channel.translations.find((row) => row.locale === locale)?.name ??
    channel.translations[0]?.name ??
    channel.slug
  );
}

export function buildHeaderNavLinks(
  channels: readonly HeaderChannel[],
): HeaderNavLink[] {
  const enabled = channels
    .filter((channel) => channel.enabled)
    .sort((left, right) => left.order - right.order);

  const links: HeaderNavLink[] = enabled.map((channel) => ({
    href: `/c/${channel.slug}`,
    label: getChannelNavLabel(channel),
  }));

  links.push({ href: "/about", label: "关于" });

  return links;
}
