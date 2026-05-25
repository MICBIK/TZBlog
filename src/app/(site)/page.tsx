import type { Metadata } from "next";

import { HomePageContent } from "@/components/site/HomePageContent";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getCurrentLocale } from "@/lib/i18n";
import { getHomePageData } from "@/lib/services/homePage";

export const metadata: Metadata = {
  title: "TZBlog",
  description: "个人技术博客",
};

export default async function HomePage() {
  const data = await getHomePageData(getCurrentLocale());

  return (
    <ThemeProvider theme="aurora" hero>
      <HomePageContent data={data} />
    </ThemeProvider>
  );
}
