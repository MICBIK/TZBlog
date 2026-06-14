import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '数据分析 - 后台管理',
  description: 'TZBlog 后台数据分析',
};

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-[5] flex items-center justify-between border-b border-[#1d2530] bg-[rgba(13,18,25,0.7)] px-[26px] py-[14px] backdrop-blur-[8px]">
        <div className="font-mono text-[12px] text-muted">
          admin ❯ <b className="text-[#aab3c0] font-normal">analytics</b>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-[26px] py-10">
        <div className="text-center">
          <div className="text-acc mb-4 font-mono text-[13px]">
            $ tail -f analytics.log
          </div>
          <p className="text-muted font-sans text-[14px]">
            数据分析页面即将上线
          </p>
          <p className="text-dim mt-2 font-sans text-[13px]">
            后端 API 联调后将展示访客统计、热门文章、流量来源等数据
          </p>
        </div>
      </div>
    </div>
  );
}
