import type { Metadata } from 'next';

import { HomeClientBehaviors } from '@/components/front-home/HomeClientBehaviors';
import { SITE_URL } from '@/lib/constants';

import { HomeRealtime } from './_components/HomeRealtime';

export const metadata: Metadata = {
  title: 'tzblog · haiden 的技术博客',
  description:
    'haiden 的中文技术博客 tzblog：记录 AI Coding、全栈工程、工具效率与随笔思考。浏览最新文章、热门标签与学习路径。',
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    type: 'website',
    siteName: 'tzblog',
    locale: 'zh_CN',
    title: 'tzblog · haiden 的技术博客',
    description: '记录 AI Coding、全栈工程、工具效率与随笔思考的中文技术博客。',
    url: `${SITE_URL}/`,
  },
  twitter: { card: 'summary' },
};

export default function HomePage() {
  return (
    <main className="relative z-[1] mx-auto max-w-[1080px] px-6">
      <HomeRealtime />
      <HomeClientBehaviors />
    </main>
  );
}
