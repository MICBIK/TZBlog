import type { Metadata } from 'next';

import { AnalyticsTopbar } from './_components/AnalyticsTopbar';
import { BarRows, type BarRow } from './_components/BarRows';
import { RangeToggle } from './_components/RangeToggle';
import { VisitorChart } from './_components/VisitorChart';

export const metadata: Metadata = {
  title: '数据分析 · tzblog',
  description: 'TZBlog 后台数据分析',
  robots: { index: false, follow: false },
};

const STATS = [
  { label: '本月访客 UV', value: '1,247', trend: '↑ 18.4% vs 上月', tone: 'up' },
  { label: '页面浏览 PV', value: '4,892', trend: '↑ 12.1% vs 上月', tone: 'up' },
  { label: '平均阅读时长', value: '4:38', trend: '↑ 32s vs 上月', tone: 'up' },
  {
    label: '跳出率',
    value: '42.3',
    unit: ' %',
    trend: '↓ 5.1% 更好',
    tone: 'good',
  },
] as const;

const SOURCES: BarRow[] = [
  { name: '搜索引擎 (Google/Bing)', v: 512, value: '512 · 41.1%' },
  { name: '直接访问', v: 298, value: '298 · 23.9%' },
  { name: '掘金 / V2EX', v: 201, value: '201 · 16.1%' },
  { name: '友情链接', v: 142, value: '142 · 11.4%' },
  { name: 'RSS 订阅', v: 94, value: '94 · 7.5%' },
];

const TERMS: BarRow[] = [
  { q: '❯', name: 'spec-first 工作流', v: 184, value: '184 次' },
  { q: '❯', name: 'RSC 缓存 force-cache', v: 152, value: '152 次' },
  { q: '❯', name: 'Go 性能优化', v: 121, value: '121 次' },
  { q: '❯', name: 'ghostty 终端配置', v: 98, value: '98 次' },
  { q: '❯', name: 'Meilisearch 全文搜索', v: 67, value: '67 次' },
];

const CATS: BarRow[] = [
  { name: 'AI Coding', v: 34, value: '34 篇 · 26.6%' },
  { name: '全栈工程', v: 41, value: '41 篇 · 32.0%' },
  { name: '工具效率', v: 23, value: '23 篇 · 18.0%' },
  { name: '随笔', v: 18, value: '18 篇 · 14.1%' },
  { name: '作品', v: 12, value: '12 篇 · 9.4%' },
];

const TOP_POSTS = [
  { title: 'spec-first：让 Claude 连续写对 3000 行', cat: 'AI Coding', reads: '2,341', up: '↑ 28%' },
  { title: 'Next.js 15 RSC 缓存的 7 个坑', cat: '全栈工程', reads: '1,876', up: '↑ 14%' },
  { title: 'Go 重写后端：120ms → 18ms', cat: '全栈工程', reads: '1,503', up: '↑ 9%' },
  { title: '2026 我的终端配置：从 zsh 到 ghostty', cat: '工具效率', reads: '1,128', up: '↑ 41%' },
  { title: '写完 100 篇博客后的反思', cat: '随笔', reads: '967', up: '↑ 6%' },
];

const TH =
  'border-b border-line px-4 py-[10px] font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#46505e]';
const TD_NUM =
  'border-b border-[#0d1219] px-4 py-[11px] text-right align-middle font-mono tabular-nums text-[#aab3c0]';

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AnalyticsTopbar />

      <div className="w-full max-w-[1180px] px-[26px] pb-10 pt-6">
        {/* 统计卡片 */}
        <div className="mb-5 grid grid-cols-4 gap-[14px] max-[880px]:grid-cols-2">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-[11px] border border-line bg-panel px-[17px] py-4"
            >
              <div className="pointer-events-none absolute -right-[14px] -top-[14px] h-[60px] w-[60px] rounded-full bg-[radial-gradient(circle,rgba(63,224,143,0.08),transparent_70%)]" />
              <div className="relative">
                <div className="font-mono text-[11px] tracking-[0.04em] text-dim">
                  {s.label}
                </div>
                <div className="my-2 mb-1 font-mono text-[28px] font-semibold tracking-[-0.01em]">
                  {s.value}
                  {'unit' in s && s.unit && (
                    <small className="text-[14px] font-normal text-[#aab3c0]">
                      {s.unit}
                    </small>
                  )}
                </div>
                <div className="flex items-center gap-[5px] font-mono text-[11px] text-acc">
                  {s.trend}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 访客趋势折线图 */}
        <div className="mb-5 overflow-hidden rounded-[11px] border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-[13px]">
            <span className="font-mono text-[12.5px] text-[#aab3c0]">
              $ tail access.log | visitors --daily · 近 30 天
            </span>
            <RangeToggle />
          </div>
          <VisitorChart />
        </div>

        {/* 流量来源 + 热门搜索词 */}
        <div className="grid grid-cols-2 items-start gap-5 max-[880px]:grid-cols-1">
          <div className="overflow-hidden rounded-[11px] border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line px-4 py-[13px]">
              <span className="font-mono text-[12.5px] text-[#aab3c0]">
                $ awk referer access.log · 流量来源
              </span>
            </div>
            <BarRows rows={SOURCES} />
          </div>
          <div className="overflow-hidden rounded-[11px] border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line px-4 py-[13px]">
              <span className="font-mono text-[12.5px] text-[#aab3c0]">
                $ grep query search.log | sort · 热门搜索词
              </span>
            </div>
            <BarRows rows={TERMS} />
          </div>
        </div>

        {/* 分类分布 + 阅读 Top 5 */}
        <div className="mt-5 grid grid-cols-2 items-start gap-5 max-[880px]:grid-cols-1">
          <div className="overflow-hidden rounded-[11px] border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line px-4 py-[13px]">
              <span className="font-mono text-[12.5px] text-[#aab3c0]">
                $ stat posts/ --by-category · 分类分布
              </span>
            </div>
            <BarRows rows={CATS} />
          </div>
          <div className="overflow-hidden rounded-[11px] border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line px-4 py-[13px]">
              <span className="font-mono text-[12.5px] text-[#aab3c0]">
                $ sort -k reads · 阅读 Top 5
              </span>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={`${TH} text-left`}>文章</th>
                  <th className={`${TH} text-right`}>阅读</th>
                  <th className={`${TH} text-right`}>趋势</th>
                </tr>
              </thead>
              <tbody>
                {TOP_POSTS.map((p) => (
                  <tr key={p.title} className="transition-colors hover:bg-[#0d1219]">
                    <td className="border-b border-[#0d1219] px-4 py-[11px] align-middle text-[13px]">
                      <div className="font-medium text-fg">{p.title}</div>
                      <div className="mt-[2px] font-mono text-[11px] text-dim">
                        {p.cat}
                      </div>
                    </td>
                    <td className={TD_NUM}>{p.reads}</td>
                    <td className={TD_NUM}>
                      <span className="text-[11px] text-acc">{p.up}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
