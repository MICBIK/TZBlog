import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '数据分析 · tzblog',
  description: 'TZBlog 后台数据分析',
  robots: { index: false, follow: false },
};

export default function AnalyticsPage() {
  return (
    <main className="mx-auto max-w-[920px] px-6 py-12">
      <div className="rounded-lg border border-line bg-panel p-6">
        <div className="font-mono text-xs text-muted-foreground">
          admin / analytics
        </div>
        <h1 className="mt-3 text-2xl font-bold text-fg-strong">数据分析</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          后端尚未提供访客 UV/PV、来源、热门搜索词、阅读时长或跳出率等分析接口。
          为避免真机测试误读模拟数据，本页暂时只保留能力说明。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-md border border-acc-dim bg-acc/10 px-4 py-2 font-mono text-sm text-acc hover:bg-acc/[0.16]"
          >
            返回控制台
          </Link>
          <Link
            href="/admin/articles"
            className="rounded-md border border-line px-4 py-2 font-mono text-sm text-muted-foreground hover:text-acc"
          >
            查看文章数据
          </Link>
        </div>
      </div>
    </main>
  );
}
