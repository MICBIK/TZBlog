import { apiGet } from '@/lib/api/client';
import type { ArticleSummary } from '@/types/article';

interface SearchHit {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content?: string;
  publishedAt?: number;
  viewCount?: number;
  readingTime?: number;
  likeCount?: number;
}

interface SearchResponse {
  hits: SearchHit[];
  estimatedTotalHits: number;
  query: string;
  limit: number;
  offset: number;
  processingTimeMs: number;
}

export interface SearchParams {
  q: string;
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
  sort?: string;
}

export interface SearchResult {
  items: ArticleSummary[];
  total: number;
}

function toIsoOrNull(value?: number): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

function normalizeHit(hit: SearchHit): ArticleSummary {
  return {
    id: Number(hit.id),
    title: hit.title,
    slug: hit.slug,
    summary: hit.summary,
    coverImage: '',
    authorId: 0,
    categoryId: 0,
    status: 'published',
    isPremium: false,
    readingTime: hit.readingTime ?? 0,
    viewCount: hit.viewCount ?? 0,
    likeCount: hit.likeCount ?? 0,
    commentCount: 0,
    publishedAt: toIsoOrNull(hit.publishedAt),
    createdAt: toIsoOrNull(hit.publishedAt) ?? new Date(0).toISOString(),
    updatedAt: toIsoOrNull(hit.publishedAt) ?? new Date(0).toISOString(),
  };
}

export async function searchArticles(params: SearchParams): Promise<SearchResult> {
  const result = await apiGet<SearchResponse>('/search', {
    params,
  });

  return {
    items: result.hits.map(normalizeHit),
    total: result.estimatedTotalHits,
  };
}
