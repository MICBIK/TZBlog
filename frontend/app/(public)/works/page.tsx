import type { Metadata } from 'next';

import { WorksGallery } from '@/components/front-works/WorksGallery';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: '作品集',
  description:
    'haiden 的开源作品与项目：全栈应用、开发者工具与实验项目，含技术栈与仓库链接。',
  alternates: { canonical: `${SITE_URL}/works` },
  openGraph: {
    type: 'website',
    siteName: 'tzblog',
    locale: 'zh_CN',
    title: '作品集 · tzblog',
    description: 'haiden 的开源作品与项目：全栈应用、开发者工具与实验项目。',
    url: `${SITE_URL}/works`,
  },
  twitter: { card: 'summary' },
};

export default function WorksPage() {
  return (
    <main className="mx-auto w-full max-w-[1080px] flex-1 px-6">
      {/* HERO — 终端命令行风格（设计稿 front-works.html 第 127-133 行）*/}
      <header className="pb-[30px] pt-[52px] font-mono">
        <div className="text-dim mb-[14px] text-[13px]">
          <span className="text-acc">$</span> ls -la ~/projects --sort=stars
        </div>
        <h1 className="text-fg mb-[10px] font-mono text-[clamp(28px,5vw,42px)] font-semibold tracking-[-0.01em]">
          构建过的<span className="text-acc">东西</span>
        </h1>
        <p className="text-muted max-w-[60ch] font-sans text-[15.5px]">
          从这个博客本身，到给它配的搜索、渲染与构建工具链——能跑、在用、开源。下面是按
          star 排序的真实仓库。
        </p>
      </header>

      <WorksGallery />
    </main>
  );
}
