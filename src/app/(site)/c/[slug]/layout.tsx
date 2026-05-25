import { notFound } from "next/navigation";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { db } from "@/lib/db";
import { resolveChannelTheme } from "@/lib/theme/resolveTheme";

export default async function ChannelSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const channel = await db.channel.findUnique({
    where: { slug },
    select: { kind: true, layout: true },
  });

  if (!channel) notFound();

  const theme = resolveChannelTheme(channel);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
