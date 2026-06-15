import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '归档',
  description: '按时间归档浏览 TZBlog 的全部文章。',
};

// Mock 数据 - 实际应从 API 获取
const mockArchiveData = [
  {
    category: 'AI Coding',
    count: 12,
    posts: [
      {
        date: '2026-06-12',
        title: 'Claude Code 实战：从零到一构建全栈博客',
        category: 'AI Coding',
      },
      {
        date: '2026-06-08',
        title: 'Prompt Engineering 最佳实践',
        category: 'AI Coding',
      },
    ],
  },
  {
    category: '全栈工程',
    count: 8,
    posts: [
      {
        date: '2026-06-05',
        title: 'Next.js 15 App Router 深度解析',
        category: '全栈工程',
      },
      {
        date: '2026-06-01',
        title: 'Go + Next.js 前后端分离架构实践',
        category: '全栈工程',
      },
    ],
  },
];

export default function ArchivePage() {
  return (
    <main className="mx-auto w-full max-w-[1080px] flex-1 px-6 pb-[60px] pt-10">
      {/* 页面标题区 */}
      <div className="mb-[22px]">
        <p className="text-muted mb-2 font-mono text-[13.5px]">
          <span className="text-acc">$</span> ls -la{' '}
          <span className="text-amber">~/posts</span> | sort
        </p>
        <h1 className="text-fg-strong font-sans text-[clamp(26px,3.4vw,36px)] font-bold leading-tight tracking-[-0.01em]">
          文章归档
        </h1>
        <p className="text-muted mt-[6px] font-sans text-[14px]">
          全部 <b className="text-fg font-normal">20</b> 篇 · 按{' '}
          <span className="text-fg">分类</span>聚合
        </p>
      </div>

      {/* 视图切换 */}
      <div className="border-line mb-[22px] flex flex-wrap gap-[6px] border-b">
        <button className="text-acc border-acc -mb-px border-b-2 bg-transparent px-[14px] py-[9px] font-mono text-[13.5px] transition-[.15s] before:mr-[5px] before:text-dim before:content-['--']">
          分类
        </button>
        <button className="text-muted -mb-px border-b-2 border-transparent bg-transparent px-[14px] py-[9px] font-mono text-[13.5px] transition-[.15s] before:mr-[5px] before:text-dim before:content-['--'] hover:text-acc">
          标签
        </button>
        <button className="text-muted -mb-px border-b-2 border-transparent bg-transparent px-[14px] py-[9px] font-mono text-[13.5px] transition-[.15s] before:mr-[5px] before:text-dim before:content-['--'] hover:text-acc">
          年份
        </button>
      </div>

      {/* 归档分组列表 */}
      <div className="flex flex-col gap-[26px]">
        {mockArchiveData.map((group) => (
          <div key={group.category}>
            {/* 分组标题 */}
            <div className="border-line text-muted mb-[10px] flex items-baseline gap-[10px] border-b border-dashed pb-2 font-mono text-[13px]">
              <span className="text-acc text-[15px] font-semibold before:text-acc-dim before:content-['#_']">
                {group.category}
              </span>
              <span className="text-dim ml-auto text-[12px]">
                {group.count} 篇
              </span>
            </div>

            {/* 文章列表 */}
            <div className="flex flex-col">
              {group.posts.map((post, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="flex items-baseline gap-[14px] rounded-[7px] border border-transparent px-[14px] py-[10px] transition-[.16s] hover:border-line hover:bg-panel"
                >
                  <span className="text-dim min-w-[84px] whitespace-nowrap font-mono text-[12px] tabular-nums">
                    {post.date}
                  </span>
                  <span className="text-fg font-sans text-[15px] transition-colors hover:text-acc">
                    {post.title}
                  </span>
                  <span className="text-muted ml-auto whitespace-nowrap font-mono text-[11.5px] before:text-dim before:content-['#']">
                    {post.category}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
