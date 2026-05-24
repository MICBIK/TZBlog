import { GithubCard } from "@/components/site/GithubCard";
import { HomeColumns } from "@/components/site/HomeColumns";
import { HomeFeaturedAndRecent } from "@/components/site/HomeFeaturedAndRecent";
import { HomeShell } from "@/components/site/HomeShell";
import { HomeHero } from "@/components/site/HomeHero";
import { HomePrinciples } from "@/components/site/HomePrinciples";
import { HomeStats } from "@/components/site/HomeStats";
import { TechStack } from "@/components/site/TechStack";

export default function HomePage() {
  return (
    <HomeShell
      hero={<HomeHero />}
      featuredAndRecent={<HomeFeaturedAndRecent />}
      columns={<HomeColumns />}
      principles={<HomePrinciples />}
      techStack={<TechStack />}
      github={<GithubCard />}
      stats={<HomeStats />}
    />
  );
}
