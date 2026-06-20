import type { Metadata } from 'next';

import { SITE_URL } from '@/lib/constants';

import { SearchClient } from './_components/SearchClient';

export const metadata: Metadata = {
  title: 'tzblog · 搜索',
  description:
    '搜索 tzblog 全站文章：AI Coding、全栈工程、工具效率、随笔与作品，支持关键词与分类实时检索。',
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: {
    type: 'website',
    siteName: 'tzblog',
    locale: 'zh_CN',
    title: '搜索 · tzblog',
    description: '搜索 tzblog 全站文章，支持关键词与分类实时检索。',
    url: `${SITE_URL}/search`,
  },
  twitter: { card: 'summary' },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, category } = await searchParams;
  return (
    <main>
      <SearchClient initialQuery={q ?? ''} initialCategory={category ?? 'all'} />
    </main>
  );
}
