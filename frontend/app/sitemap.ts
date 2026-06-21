import type { MetadataRoute } from 'next';

import { API_BASE_URL, SITE_URL } from '@/lib/constants';
import type { ArticleSummary } from '@/types/article';

/**
 * 动态 sitemap 生成器。
 * 拉取所有已发布文章，生成 sitemap.xml（供搜索引擎爬取）。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/archive`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/library`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/pathways`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // 动态拉取已发布文章
  let articles: ArticleSummary[] = [];
  try {
    const res = await fetch(
      `${API_BASE_URL}/articles?status=published&limit=1000`,
      {
        next: { revalidate: 3600 },
      },
    );
    if (res.ok) {
      const json = (await res.json()) as { data?: ArticleSummary[] };
      articles = json.data ?? [];
    }
  } catch (error) {
    console.error('[sitemap] Failed to fetch articles:', error);
  }

  // 文章页面
  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/articles/${article.slug}`,
    lastModified: new Date(article.updatedAt || article.createdAt),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticPages, ...articlePages];
}
