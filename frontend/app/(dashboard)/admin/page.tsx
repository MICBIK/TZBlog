import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '仪表盘 - 后台管理',
  description: 'TZBlog 后台管理仪表盘',
};

// Mock 数据
const stats = [
  { label: '文章总数', value: '128', trend: '↑ 本月 +6', trendType: 'up' },
  {
    label: '本月访客',
    value: '1,247',
    trend: '↑ 18.4% vs 上月',
    trendType: 'up',
  },
  {
    label: '全站字数',
    value: '38.6',
    unit: '万',
    trend: '— 稳定产出',
    trendType: 'flat',
  },
  { label: '待审评论', value: '3', trend: '需处理', trendType: 'down' },
];

const recentPosts = [
  {
    title: 'spec-first：让 Claude 连续写对 3000 行',
    category: 'AI Coding',
    status: 'published',
    views: 2341,
    updated: '3天前',
  },
  {
    title: 'Next.js 15 RSC 缓存的 7 个坑',
    category: '全栈工程',
    status: 'published',
    views: 1876,
    updated: '6天前',
  },
  {
    title: 'Go 重写后端：120ms → 18ms',
    category: '全栈工程',
    status: 'published',
    views: 1503,
    updated: '11天前',
  },
  {
    title: '用 Meilisearch 给博客加全文搜索',
    category: '全栈工程',
    status: 'draft',
    views: null,
    updated: '1天前',
  },
  {
    title: '2026 我的终端配置：从 zsh 到 ghostty',
    category: '工具效率',
    status: 'draft',
    views: null,
    updated: '2小时前',
  },
];

const pendingComments = [
  {
    author: '云游君',
    article: 'spec-first',
    content:
      '这个「先写规格再让 AI 写代码」的思路太对了，我一直 vibe coding 结果返工无数次。',
  },
  {
    author: '张洪Heo',
    article: 'RSC 缓存 7 坑',
    content:
      '第 4 个坑（fetch 默认 force-cache）我也踩过，排查了一下午，文章里讲得很清楚。',
  },
  {
    author: 'Innei',
    article: 'Go 重写后端',
    content:
      '120ms→18ms 的提升主要来自哪一块？是连接池还是序列化？想看更细的火焰图。',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 顶部工具栏 */}
      <header className="sticky top-0 z-[5] flex items-center justify-between border-b border-[#1d2530] bg-[rgba(13,18,25,0.7)] px-[26px] py-[14px] backdrop-blur-[8px]">
        <div className="font-mono text-[12px] text-muted">
          admin ❯ <b className="text-[#aab3c0] font-normal">dashboard</b>
        </div>
        <div className="flex items-center gap-[10px]">
          <button className="flex items-center gap-[6px] rounded-[7px] border border-line bg-panel px-[13px] py-[7px] font-mono text-[12.5px] text-[#aab3c0] transition-[.15s] hover:border-[#46505e] hover:text-fg">
            ↻ 刷新
          </button>
          <a
            href="/admin/articles/new"
            className="flex items-center gap-[6px] rounded-[7px] border border-acc-dim bg-acc/12 px-[13px] py-[7px] font-mono text-[12.5px] text-acc transition-[.15s] hover:bg-acc/18"
          >
            ＋ 写文章
          </a>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="w-full max-w-[1180px] px-[26px] pb-10 pt-6">
        {/* 统计卡片 */}
        <div className="mb-7 grid grid-cols-4 gap-[14px]">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-[11px] border border-line bg-panel px-[17px] py-4"
            >
              {/* 背景光晕 */}
              <div className="pointer-events-none absolute -right-[14px] -top-[14px] h-[60px] w-[60px] rounded-full bg-[radial-gradient(circle,rgba(63,224,143,0.08),transparent_70%)]" />

              <div className="relative">
                <div className="font-mono text-[11px] tracking-[0.04em] text-muted">
                  {stat.label}
                </div>
                <div className="my-2 font-mono text-[28px] font-semibold tracking-[-0.01em]">
                  {stat.value}
                  {stat.unit && (
                    <small className="text-[14px] font-normal text-[#aab3c0]">
                      {' '}
                      {stat.unit}
                    </small>
                  )}
                </div>
                <div
                  className={`flex items-center gap-[5px] font-mono text-[11px] ${
                    stat.trendType === 'up'
                      ? 'text-acc'
                      : stat.trendType === 'down'
                        ? 'text-[#e06a5a]'
                        : 'text-muted'
                  }`}
                >
                  {stat.trend}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 两列布局 */}
        <div className="grid grid-cols-[1.55fr_1fr] items-start gap-5">
          {/* 左侧：最近文章 + 访客趋势 */}
          <div className="flex flex-col gap-5">
            {/* 最近文章 */}
            <div className="overflow-hidden rounded-[11px] border border-line bg-panel">
              <div className="flex items-center justify-between border-b border-line px-4 py-[13px]">
                <span className="font-mono text-[12.5px] text-[#aab3c0]">
                  $ ls -t posts/ | head
                </span>
                <a
                  href="/admin/articles"
                  className="font-mono text-[11.5px] text-muted hover:text-acc"
                >
                  管理全部 →
                </a>
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-line px-4 py-[10px] text-left font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#46505e]">
                      文章
                    </th>
                    <th className="border-b border-line px-4 py-[10px] text-left font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#46505e]">
                      状态
                    </th>
                    <th className="border-b border-line px-4 py-[10px] text-right font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#46505e]">
                      阅读
                    </th>
                    <th className="border-b border-line px-4 py-[10px] text-right font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#46505e]">
                      更新
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentPosts.map((post, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-[#0d1219] transition-colors"
                    >
                      <td className="border-b border-[#0d1219] px-4 py-[11px] align-middle text-[13px]">
                        <div className="font-medium text-fg">{post.title}</div>
                        <div className="mt-[2px] font-mono text-[11px] text-muted">
                          {post.category}
                        </div>
                      </td>
                      <td className="border-b border-[#0d1219] px-4 py-[11px]">
                        <span
                          className={`inline-block rounded-[5px] border px-2 py-[3px] font-mono text-[10.5px] ${
                            post.status === 'published'
                              ? 'border-acc-dim bg-acc/8 text-acc'
                              : 'border-[rgba(232,179,57,0.4)] bg-[rgba(232,179,57,0.08)] text-[#e8b339]'
                          }`}
                        >
                          {post.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </td>
                      <td className="border-b border-[#0d1219] px-4 py-[11px] text-right font-mono tabular-nums text-[#aab3c0]">
                        {post.views ?? '—'}
                      </td>
                      <td className="border-b border-[#0d1219] px-4 py-[11px] text-right font-mono tabular-nums text-[#aab3c0]">
                        {post.updated}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 访客趋势（占位） */}
            <div className="overflow-hidden rounded-[11px] border border-line bg-panel">
              <div className="flex items-center justify-between border-b border-line px-4 py-[13px]">
                <span className="font-mono text-[12.5px] text-[#aab3c0]">
                  $ tail -f access.log · 近 14 天访客
                </span>
                <a
                  href="/admin/analytics"
                  className="font-mono text-[11.5px] text-muted hover:text-acc"
                >
                  详细分析 →
                </a>
              </div>
              <div className="flex h-[96px] items-end gap-1 px-4 py-4">
                {[62, 71, 58, 84, 93, 77, 68, 102, 118, 96, 87, 124, 109, 141].map(
                  (v, i) => {
                    const max = 141;
                    const height = (v / max) * 100;
                    return (
                      <div
                        key={i}
                        className="min-h-1 flex-1 rounded-t-[3px] bg-gradient-to-t from-[rgba(63,224,143,0.15)] to-acc-dim transition-[.2s] hover:bg-gradient-to-t hover:from-[rgba(63,224,143,0.3)] hover:to-acc"
                        style={{
                          height: `${height}%`,
                        }}
                        title={`${v} 访客`}
                      />
                    );
                  }
                )}
              </div>
              <div className="flex justify-between px-4 pb-[14px] font-mono text-[10px] text-[#46505e]">
                <span>05-18</span>
                <span>05-25</span>
                <span>05-31</span>
              </div>
            </div>
          </div>

          {/* 右侧：待审评论 */}
          <div className="overflow-hidden rounded-[11px] border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line px-4 py-[13px]">
              <span className="font-mono text-[12.5px] text-[#aab3c0]">
                $ comments --pending
              </span>
              <span className="font-mono text-[11px] text-[#e8b339]">
                {pendingComments.length} 待审
              </span>
            </div>

            {pendingComments.map((comment, idx) => (
              <div
                key={idx}
                className="border-b border-[#0d1219] px-4 py-[13px] last:border-b-0"
              >
                <div className="mb-[5px] flex items-center gap-2">
                  <b className="text-[12.5px]">{comment.author}</b>
                  <span className="font-mono text-[11px] text-muted">
                    on《{comment.article}》
                  </span>
                </div>
                <p className="mb-[7px] text-[12.5px] text-[#aab3c0]">
                  {comment.content}
                </p>
                <div className="flex gap-[7px]">
                  <button className="rounded-[5px] border border-line bg-transparent px-[9px] py-1 font-mono text-[11px] text-muted transition-[.15s] hover:border-acc-dim hover:text-acc">
                    ✓ 通过
                  </button>
                  <button className="rounded-[5px] border border-line bg-transparent px-[9px] py-1 font-mono text-[11px] text-muted transition-[.15s] hover:border-[rgba(224,106,90,0.4)] hover:text-[#e06a5a]">
                    ✕ 删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
