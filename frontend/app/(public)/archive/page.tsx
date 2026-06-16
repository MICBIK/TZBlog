import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ArchiveClient } from './_components/ArchiveClient';

export const metadata: Metadata = {
  title: '归档 · 分类 / 标签 / 年份 — tzblog',
  description:
    'tzblog 全部文章归档，按分类、标签、年份浏览 haiden 的 AI Coding、全栈工程、工具效率与随笔。',
  alternates: { canonical: 'https://tzcode.top/archive' },
  openGraph: {
    type: 'website',
    siteName: 'tzblog',
    locale: 'zh_CN',
    title: '归档 · 分类 / 标签 / 年份 — tzblog',
    description: 'tzblog 全部文章归档，按分类、标签、年份浏览。',
    url: 'https://tzcode.top/archive',
  },
  twitter: { card: 'summary' },
};

export default function ArchivePage() {
  return (
    <main className="flex-1 py-10 pb-[60px] pt-10">
      <Suspense fallback={null}>
        <ArchiveClient />
      </Suspense>
    </main>
  );
}
