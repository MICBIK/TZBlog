import type { Metadata } from 'next';

import { LibraryTabs } from '@/components/front-library/LibraryTabs';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: '归档与书架',
  description:
    'tzblog 文章归档与技术书架：按年份浏览全部文章，以及 haiden 在读与推荐的技术书单。',
  alternates: { canonical: `${SITE_URL}/library` },
  openGraph: {
    type: 'website',
    siteName: 'tzblog',
    locale: 'zh_CN',
    title: '归档与书架 · tzblog',
    description: '按年份浏览全部文章，以及 haiden 在读与推荐的技术书单。',
    url: `${SITE_URL}/library`,
  },
  twitter: { card: 'summary' },
};

export default function LibraryPage() {
  return (
    <main className="relative z-[1] mx-auto w-full max-w-[860px] flex-1 px-6">
      {/* HERO — 终端命令行风格（设计稿 front-library.html 第 96-102 行）*/}
      <header className="pb-6 pt-[52px] font-mono">
        <p className="text-muted-foreground mb-[14px] text-[13px]">
          <span className="text-acc">$</span> tree ~/posts --by-year &amp;&amp; cat
          ~/reading.list
        </p>
        <h1 className="mb-[10px] font-mono text-[clamp(28px,5vw,40px)] font-semibold tracking-[-0.01em] text-fg">
          归档 &amp; <span className="text-acc">书架</span>
        </h1>
        <p className="max-w-[58ch] font-sans text-[15px] text-dim">
          所有写过的字按时间倒序排好，外加这几年真正读完、在读、想读的技术书——只列对我有用的，不凑数。
        </p>
      </header>

      <LibraryTabs />
    </main>
  );
}
