'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/** 归档文章（1:1 照搬原型 archive.html 内联 POSTS）*/
interface ArchivePost {
  readonly ti: string;
  readonly date: string;
  readonly cat: string;
  readonly tags: readonly string[];
}

const POSTS: readonly ArchivePost[] = [
  {
    ti: 'spec-first：让 Claude 连续写对 3000 行代码',
    date: '2026-05-18',
    cat: 'AI Coding',
    tags: ['Claude', '工作流', 'spec'],
  },
  {
    ti: 'Next.js 15 RSC 缓存踩过的 7 个坑',
    date: '2026-04-22',
    cat: '全栈工程',
    tags: ['Next.js', 'RSC', '缓存'],
  },
  {
    ti: '把 Go 后端从 120ms 优化到 18ms',
    date: '2026-03-09',
    cat: '全栈工程',
    tags: ['Go', '性能', 'pprof'],
  },
  {
    ti: '2026 我的终端配置：zsh + tmux + neovim',
    date: '2026-02-14',
    cat: '工具效率',
    tags: ['终端', 'zsh', 'neovim'],
  },
  {
    ti: '写完 100 篇博客后的一些反思',
    date: '2026-01-03',
    cat: '随笔思考',
    tags: ['写作', '复盘'],
  },
  {
    ti: '用 Meilisearch 给博客加全文搜索',
    date: '2025-12-20',
    cat: '全栈工程',
    tags: ['搜索', 'Meilisearch'],
  },
  {
    ti: 'Shiki + KaTeX：博客代码与公式渲染管线',
    date: '2025-11-11',
    cat: '工具效率',
    tags: ['Shiki', 'KaTeX', 'Markdown'],
  },
  {
    ti: 'Docker 多阶段构建把镜像砍到 40MB',
    date: '2025-10-08',
    cat: '全栈工程',
    tags: ['Docker', '部署'],
  },
] as const;

type ByKey = 'cat' | 'tag' | 'year';

const NAME: Record<ByKey, string> = { cat: '分类', tag: '标签', year: '年份' };

const LSCMD: Record<ByKey, string> = {
  cat: '~/posts --by-cat',
  tag: '~/posts --by-tag',
  year: '~/posts --by-year',
};

/** 归档目标（原型所有条目指向同一篇教程文章）*/
const POST_HREF = '/articles/spec-first-workflow';

interface ArchiveGroup {
  readonly key: string;
  readonly items: readonly ArchivePost[];
}

/** 还原原型 group()：按维度聚合，年份倒序、其余按条目数倒序 */
function group(by: ByKey): ArchiveGroup[] {
  const map = new Map<string, ArchivePost[]>();
  POSTS.forEach((p) => {
    const keys =
      by === 'tag' ? p.tags : by === 'year' ? [p.date.slice(0, 4)] : [p.cat];
    keys.forEach((k) => {
      const bucket = map.get(k) ?? [];
      bucket.push(p);
      map.set(k, bucket);
    });
  });
  return Array.from(map.keys())
    .sort((a, b) =>
      by === 'year'
        ? b.localeCompare(a)
        : (map.get(b)?.length ?? 0) - (map.get(a)?.length ?? 0),
    )
    .map((k) => ({ key: k, items: map.get(k) ?? [] }));
}

export function ArchiveClient() {
  const searchParams = useSearchParams();

  // 支持 ?by=tag|year|cat 深链（还原原型 init 逻辑）
  const initialBy: ByKey = useMemo(() => {
    const raw = searchParams.get('by');
    return raw === 'tag' || raw === 'year' || raw === 'cat' ? raw : 'cat';
  }, [searchParams]);

  const [by, setBy] = useState<ByKey>(initialBy);

  const groups = useMemo(() => group(by), [by]);

  const TABS: readonly ByKey[] = ['cat', 'tag', 'year'];

  return (
    <div className="relative z-[1] mx-auto w-full max-w-[1080px] px-6">
      {/* head — 还原原型 .head */}
      <div className="mb-[22px]">
        <p className="mb-2 font-mono text-[13.5px] text-muted-foreground">
          <span className="text-acc">$</span> ls -la{' '}
          <span className="text-amber">{LSCMD[by]}</span> | sort
        </p>
        <h1 className="font-sans text-[clamp(26px,3.4vw,36px)] font-bold tracking-[-0.01em] text-fg-strong">
          文章归档
        </h1>
        <p className="mt-1.5 font-sans text-[14px] text-muted-foreground">
          全部 <b className="text-fg-strong">{POSTS.length}</b> 篇 · 按{' '}
          <span>{NAME[by]}</span>聚合
        </p>
      </div>

      {/* views — 还原原型 .views tablist */}
      <div
        role="tablist"
        className="mb-[22px] mt-5 flex flex-wrap gap-1.5 border-b border-line"
      >
        {TABS.map((key) => {
          const on = by === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setBy(key)}
              className={[
                "-mb-px cursor-pointer border-0 border-b-2 bg-transparent px-3.5 py-[9px] font-mono text-[13.5px] transition-[.15s] before:mr-[5px] before:text-dim before:content-['--']",
                on
                  ? 'border-acc text-acc'
                  : 'border-transparent text-muted-foreground hover:text-acc',
              ].join(' ')}
            >
              {NAME[key]}
            </button>
          );
        })}
      </div>

      {/* groups — 还原原型 #out，aria-live polite */}
      <div className="flex flex-col gap-[26px]" aria-live="polite">
        {groups.map((g) => (
          <section key={g.key}>
            {/* grp-h */}
            <div className="mb-2.5 flex items-baseline gap-2.5 border-b border-dashed border-line pb-2 font-mono text-[13px] text-muted-foreground">
              <span className="text-[15px] font-semibold text-acc before:text-acc-dim before:content-['#_']">
                {g.key}
              </span>
              <span className="ml-auto text-[12px] text-dim">
                {g.items.length} 篇
              </span>
            </div>
            {/* posts */}
            {g.items.map((p, i) => (
              <Link
                key={`${g.key}-${p.ti}-${i}`}
                href={POST_HREF}
                className="group flex flex-wrap items-baseline gap-x-3.5 gap-y-1 rounded-[7px] border border-transparent px-3.5 py-2.5 transition-[.16s] hover:border-line hover:bg-panel min-[561px]:flex-nowrap"
              >
                <span className="min-w-[84px] whitespace-nowrap font-mono text-[12px] tabular-nums text-dim">
                  {p.date}
                </span>
                <span className="font-sans text-[15px] text-fg transition-colors group-hover:text-acc">
                  {p.ti}
                </span>
                <span className="whitespace-nowrap font-mono text-[11.5px] text-muted-foreground before:text-dim before:content-['#'] max-[560px]:ml-0 min-[561px]:ml-auto">
                  {p.cat}
                </span>
              </Link>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
