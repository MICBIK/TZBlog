'use client';

import { useEffect, useState } from 'react';

/** GitHub 仓库图标（还原原型内联 SVG ICON）*/
function RepoIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-[15px] w-[15px] opacity-75"
      aria-hidden="true"
    >
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.5 2.5 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.5 2.5 0 0 1 4.5 9h8Z" />
    </svg>
  );
}

type StatusKey = 'active' | 'maint' | 'arch';

interface Repo {
  readonly name: string;
  readonly lang: string;
  readonly f: string;
  readonly dot: string;
  readonly status: readonly [StatusKey, string];
  readonly desc: string;
  readonly stars: string;
  readonly commit: string;
  readonly issues: number;
}

/** 仓库数据（1:1 照搬原型 repos 数组，含中文文案）*/
const REPOS: readonly Repo[] = [
  {
    name: 'tzblog',
    lang: 'TypeScript',
    f: 'ts',
    dot: '#3178c6',
    status: ['active', '在线'],
    desc: '你正在看的这个博客本体。Next.js 15 App Router + RSC，Go 写的内容 API，Postgres 存储，Docker 部署到自己的 VPS。',
    stars: '1.2k',
    commit: '3 天前',
    issues: 4,
  },
  {
    name: 'spec-runner',
    lang: 'TypeScript',
    f: 'ts',
    dot: '#3178c6',
    status: ['active', '在线'],
    desc: '把「先写 spec 再让 Claude 写代码」固化成 CLI：维护规格文件、生成上下文、跑验收回归。连续写对 3000 行就靠它。',
    stars: '860',
    commit: '6 天前',
    issues: 11,
  },
  {
    name: 'meili-blog',
    lang: 'Rust',
    f: 'rust',
    dot: '#dea584',
    status: ['active', '在线'],
    desc: '给静态/SSR 博客挂 Meilisearch 全文搜索的胶水层：增量索引、中文分词配置、前端即时检索组件。',
    stars: '540',
    commit: '2 周前',
    issues: 7,
  },
  {
    name: 'go-api-fast',
    lang: 'Go',
    f: 'go',
    dot: '#00add8',
    status: ['maint', '维护中'],
    desc: '后端从 Node 重写到 Go 的脚手架沉淀：连接池、缓存层、中间件，把 P99 从 120ms 压到 18ms 的那套。',
    stars: '480',
    commit: '1 月前',
    issues: 3,
  },
  {
    name: 'shiki-katex-md',
    lang: 'TypeScript',
    f: 'ts',
    dot: '#3178c6',
    status: ['maint', '维护中'],
    desc: 'Markdown 渲染管线：Shiki 双主题代码高亮 + KaTeX 公式 + 标题锚点 + TOC 提取，给技术博客用的。',
    stars: '210',
    commit: '1 月前',
    issues: 2,
  },
  {
    name: 'dotfiles',
    lang: 'Shell',
    f: 'shell',
    dot: '#89e051',
    status: ['arch', '长期'],
    desc: '2026 版终端配置：zsh + starship + tmux + neovim，一行 install.sh 在新机器上复刻整套环境。',
    stars: '120',
    commit: '3 月前',
    issues: 0,
  },
];

/** 过滤芯片（还原原型 .filters，仅 all 显示计数）*/
const FILTERS = [
  { f: 'all', label: 'all', count: REPOS.length },
  { f: 'ts', label: 'TypeScript' },
  { f: 'go', label: 'Go' },
  { f: 'rust', label: 'Rust' },
  { f: 'shell', label: 'Shell' },
] as const;

/** 状态徽标配色（还原原型 .status.active/.maint/.arch）*/
const STATUS_CLASS: Record<StatusKey, string> = {
  active: 'text-acc border-acc-dim bg-acc/[0.08]',
  maint: 'text-amber border-[#5a4a1f] bg-amber/[0.08]',
  arch: 'text-dim border-line',
};

const STAGGER_MS = 60;

export function WorksGallery() {
  const [active, setActive] = useState('all');
  const [shownCount, setShownCount] = useState(0);

  const list = REPOS.filter((r) => active === 'all' || r.f === active);

  // 统计行：与原型 JS 一致（parseFloat 求和 → toFixed(1)+'k'）
  const total = list.reduce((s, r) => s + parseFloat(r.stars), 0);
  const totalLabel = total >= 1 ? `${total.toFixed(1)}k` : '—';

  // 卡片错峰入场（还原 requestAnimationFrame+setTimeout(i*60)）；RM 下直接全显
  useEffect(() => {
    const count = list.length;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion:reduce)',
    ).matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // rAF 推迟首帧 setState（避免 effect 同步触发级联渲染，且贴合原型 rAF 行为）
    const raf = requestAnimationFrame(() => {
      if (reduce) {
        setShownCount(count);
        return;
      }
      setShownCount(0);
      for (let i = 0; i < count; i += 1) {
        timers.push(
          setTimeout(
            () => setShownCount((c) => Math.max(c, i + 1)),
            i * STAGGER_MS,
          ),
        );
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
    // 仅依赖 active：切换过滤时重放入场
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <>
      {/* 过滤芯片 */}
      <div className="flex flex-wrap gap-2 pb-[26px] pt-2 font-mono">
        {FILTERS.map((chip) => {
          const on = active === chip.f;
          return (
            <button
              key={chip.f}
              type="button"
              onClick={() => setActive(chip.f)}
              aria-pressed={on}
              className={
                'rounded-[6px] border px-[13px] py-1.5 text-[12.5px] transition-[.16s] ' +
                (on
                  ? 'border-acc bg-acc font-semibold text-[#06140c]'
                  : 'border-line text-muted bg-panel hover:border-acc-dim hover:text-fg')
              }
            >
              {chip.label}
              {'count' in chip && chip.count !== undefined ? (
                <span className="ml-[5px] opacity-60">{chip.count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 计数行 */}
      <div className="text-dim pb-4 font-mono text-[12.5px]">
        &gt; <b className="text-acc font-semibold">{list.length}</b> 个仓库 · 共{' '}
        <b className="text-acc font-semibold">{totalLabel}</b> stars
      </div>

      {/* 仓库网格 */}
      <div className="grid grid-cols-1 gap-4 pb-[60px] md:grid-cols-2">
        {list.map((r, i) => {
          const shown = i < shownCount;
          return (
            <article
              key={r.name}
              className={
                'border-line bg-panel flex flex-col gap-3 rounded-[10px] border p-5 ' +
                'transition-[opacity,transform,box-shadow,border-color] duration-200 ease-out ' +
                'hover:border-acc-dim hover:-translate-y-[3px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] ' +
                (shown ? 'opacity-100 translate-y-0' : 'translate-y-[14px] opacity-0')
              }
            >
              {/* 顶部：仓库名 + 状态 */}
              <div className="flex items-center justify-between gap-[10px]">
                <span className="text-acc flex items-center gap-[7px] font-mono text-[15px] font-semibold">
                  <RepoIcon />
                  {r.name}
                </span>
                <span
                  className={
                    'rounded-[20px] border px-2 py-[3px] font-mono text-[11px] ' +
                    STATUS_CLASS[r.status[0]]
                  }
                >
                  {r.status[1]}
                </span>
              </div>

              {/* 描述 */}
              <p className="text-muted flex-1 font-sans text-[14px]">{r.desc}</p>

              {/* 技术栈 */}
              <div className="flex flex-wrap gap-[6px]">
                <span className="text-muted bg-panel2 inline-flex items-center rounded-[5px] px-2 py-[3px] font-mono text-[11.5px]">
                  <span
                    className="mr-[6px] inline-block h-2 w-2 rounded-full align-middle"
                    style={{ background: r.dot }}
                  />
                  {r.lang}
                </span>
              </div>

              {/* 元信息 */}
              <div className="border-line text-dim flex gap-[18px] border-t pt-[10px] font-mono text-[12px]">
                <span className="flex items-center gap-[5px]">
                  ★ <b className="text-muted font-medium">{r.stars}</b>
                </span>
                <span className="flex items-center gap-[5px]">
                  ⊙ <b className="text-muted font-medium">{r.issues}</b> issues
                </span>
                <span className="flex items-center gap-[5px]">↻ {r.commit}</span>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
