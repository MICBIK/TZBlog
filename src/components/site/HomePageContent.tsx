import { ChannelPreviewBlock } from "@/components/site/ChannelPreviewBlock";
import { HomePageHero } from "@/components/site/HomePageHero";
import { HomeTrending } from "@/components/site/HomeTrending";
import type { HomePageData } from "@/lib/services/homePage";

export interface HomePageContentProps {
  data: HomePageData;
}

export function HomePageContent({ data }: HomePageContentProps) {
  return (
    <div className="space-y-16">
      <HomePageHero hero={data.hero} />
      <div className="space-y-14">
        {data.channels.map((channel) => (
          <ChannelPreviewBlock key={channel.id} channel={channel} />
        ))}
      </div>
      <HomeTrending items={data.trending} />
    </div>
  );
}
