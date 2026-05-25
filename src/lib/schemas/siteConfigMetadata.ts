import { z } from "zod";

export const siteConfigHeroSchema = z.object({
  tagline: z.string().min(1),
  subtitle: z.string().min(1),
  avatar: z.string().url().optional(),
  location: z.string().optional(),
});

export type SiteConfigHero = z.infer<typeof siteConfigHeroSchema>;

const siteConfigMetadataSchema = z.object({
  hero: siteConfigHeroSchema.optional(),
});

export function parseSiteConfigHero(metadata: unknown): SiteConfigHero {
  const parsed = siteConfigMetadataSchema.safeParse(metadata);
  if (parsed.success && parsed.data.hero) {
    return parsed.data.hero;
  }

  return {
    tagline: "个人写作，工程实现，克制表达。",
    subtitle:
      "这里记录一个中文单语博客系统的技术实践：从 source-first Markdown 编辑，到 PostgreSQL 驱动的数据层，再到能解释取舍的阅读体验。",
  };
}
