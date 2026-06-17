import type { Metadata } from 'next';

import { API_BASE_URL, SITE_URL } from '@/lib/constants';
import type { ArticleDetail } from '@/types/article';

import { ArticleDetailClient } from './_components/ArticleDetailClient';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 服务端按 slug 拉取文章，用于生成动态 metadata。
 * 走公开接口 GET /articles/slug/:slug（无需鉴权）；失败时回退到通用文案，避免 SSR 报错。
 * 让 crawler / 分享预览能拿到真实标题、canonical 与 OG（此前为固定占位 metadata）。
 */
async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/articles/slug/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: ArticleDetail };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  if (!article) {
    return {
      title: '文章详情 · tzblog',
      description: '浏览 TZBlog 的文章详情。',
    };
  }

  const description = article.summary || '浏览 TZBlog 的文章详情。';
  const url = `${SITE_URL}/articles/${article.slug}`;

  return {
    title: `${article.title} · tzblog`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      siteName: 'tzblog',
      locale: 'zh_CN',
      title: article.title,
      description,
      url,
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
    },
    twitter: { card: 'summary', title: article.title, description },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  return <ArticleDetailClient slug={slug} />;
}
