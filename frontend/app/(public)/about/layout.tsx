import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SITE_URL } from '@/lib/constants';

/**
 * about 路由的 server 壳 —— 补 DELIVERY §6.9 要求的 SEO（页面本体是 'use client'，
 * 无法 export metadata）。提供 title/description/canonical/OG(profile) 与 Person JSON-LD。
 */
export const metadata: Metadata = {
  title: '关于 · haiden · tzblog',
  description:
    '关于 haiden —— 中文优先的技术与生活博客作者，记录 AI Coding、全栈工程、工具效率、随笔与作品。',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    type: 'profile',
    title: '关于 · haiden · tzblog',
    description:
      '关于 haiden —— 中文优先的技术与生活博客作者，记录 AI Coding、全栈工程、工具效率、随笔与作品。',
    url: `${SITE_URL}/about`,
  },
};

const PERSON_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'haiden',
  url: `${SITE_URL}/about`,
  jobTitle: '全栈工程师 / 技术博主',
  knowsAbout: ['AI Coding', '全栈工程', 'TypeScript', 'React', 'Next.js', 'Go'],
  sameAs: ['https://github.com/haiden'],
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSONLD) }}
      />
      {children}
    </>
  );
}
