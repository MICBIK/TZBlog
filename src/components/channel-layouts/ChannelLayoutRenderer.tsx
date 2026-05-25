import type { ChannelLayout } from "@prisma/client";

import { CardsLayout } from "./CardsLayout";
import { ChronicleLayout } from "./ChronicleLayout";
import { FeedLayout } from "./FeedLayout";
import { GrepLayout } from "./GrepLayout";
import { TimelineLayout } from "./TimelineLayout";
import type { ChannelLayoutProps } from "./types";

type ChannelLayoutRendererProps = ChannelLayoutProps & {
  layout: ChannelLayout;
};

export function ChannelLayoutRenderer({
  layout,
  channelSlug,
  entries,
}: ChannelLayoutRendererProps) {
  switch (layout) {
    case "CHRONICLE":
      return <ChronicleLayout channelSlug={channelSlug} entries={entries} />;
    case "CARDS":
      return <CardsLayout channelSlug={channelSlug} entries={entries} />;
    case "TIMELINE":
      return <TimelineLayout channelSlug={channelSlug} entries={entries} />;
    case "GREP":
      return <GrepLayout channelSlug={channelSlug} entries={entries} />;
    case "FEED":
      return <FeedLayout channelSlug={channelSlug} entries={entries} />;
    default: {
      const _exhaustive: never = layout;
      return _exhaustive;
    }
  }
}
