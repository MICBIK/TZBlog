'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

/** 文章命中数据（1:1 照搬原型 front-search.html 内联 POSTS）*/
interface SearchPost {
  readonly t: string;
  readonly c: string;
  readonly d: string;
  readonly x: string;
  readonly read: string;
  readonly like: number;
}

const POSTS: readonly SearchPost[] = [
  {
    t: 'spec-first：让 Claude 连续写对 3000 行代码',
    c: 'AI Coding',
    d: '2026-05-28',
    x: '先写规格再写代码，把 AI 的发挥空间收敛进可验证的边界里。',
    read: '14 分钟',
    like: 312,
  },
  {
    t: 'Next.js 15 RSC 缓存的 7 个坑',
    c: '全栈',
    d: '2026-05-19',
    x: 'fetch 缓存、Router Cache、生产与开发行为分叉，逐个拆解。',
    read: '11 分钟',
    like: 208,
  },
  {
    t: 'Go 重写后端：P99 从 120ms 砍到 18ms',
    c: '全栈',
    d: '2026-05-09',
    x: '连接池、零拷贝序列化、pprof 火焰图定位三处真实瓶颈。',
    read: '16 分钟',
    like: 421,
  },
  {
    t: '2026 我的终端配置：zsh + tmux + neovim',
    c: '工具',
    d: '2026-04-30',
    x: '一套用了三年仍在迭代的命令行工作流与 dotfiles。',
    read: '9 分钟',
    like: 176,
  },
  {
    t: '用 Meilisearch 给博客加全文搜索',
    c: '全栈',
    d: '2026-04-21',
    x: '中文分词、拼写容错、毫秒级响应，自托管搜索方案落地。',
    read: '10 分钟',
    like: 154,
  },
  {
    t: 'Shiki + KaTeX：博客的代码与公式渲染',
    c: '工具',
    d: '2026-04-12',
    x: '构建期高亮、零运行时 JS，公式服务端渲染的取舍。',
    read: '8 分钟',
    like: 131,
  },
  {
    t: 'Docker 多阶段构建把镜像砍到 40MB',
    c: '工具',
    d: '2026-03-30',
    x: 'distroless 基镜像、依赖分层缓存、构建提速 6 倍。',
    read: '7 分钟',
    like: 142,
  },
  {
    t: '写完 100 篇博客后，我对写作的重新理解',
    c: '随笔',
    d: '2026-03-18',
    x: '流量不是目的，把模糊的想法逼到清晰才是写作的回报。',
    read: '6 分钟',
    like: 389,
  },
] as const;

/** 分类 chip（对照原型 data-cat）*/
const CATS: readonly { readonly cat: string; readonly label: string }[] = [
  { cat: 'all', label: '全部' },
  { cat: 'AI Coding', label: 'AI Coding' },
  { cat: '全栈', label: '全栈工程' },
  { cat: '工具', label: '工具效率' },
  { cat: '随笔', label: '思考随笔' },
] as const;

/** 命中文章目标（原型所有 hit 指向同一篇教程文章）*/
const HIT_HREF = '/articles/spec-first-workflow';

/** 关键词高亮 — 还原原型 hl()，React 自动转义，仅需切分包裹 <mark> */
function highlight(text: string, kw: string) {
  if (!kw) return text;
  const safe = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safe})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === kw.toLowerCase() ? (
      <mark
        key={i}
        className="rounded-[2px] bg-acc/[0.16] px-0.5 text-acc"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

/** 关键词 ∩ 当前分类过滤（纯函数，还原原型 render() 过滤逻辑）*/
function filterPosts(kw: string, cat: string): SearchPost[] {
  return POSTS.filter(
    (p) =>
      (cat === 'all' || p.c === cat) &&
      (!kw || (p.t + p.x + p.c).toLowerCase().includes(kw.toLowerCase())),
  );
}

export function SearchClient() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [focused, setFocused] = useState(false);
  const [ms, setMs] = useState('0.00');
  const inputRef = useRef<HTMLInputElement>(null);

  const kw = query.trim();

  const list = useMemo(() => filterPosts(kw, cat), [kw, cat]);

  /** 测量本次检索耗时（仅在事件中调用 performance.now，保持 render 纯净）*/
  const measure = useCallback((nextKw: string, nextCat: string) => {
    const t0 = performance.now();
    filterPosts(nextKw, nextCat);
    setMs((performance.now() - t0).toFixed(2));
  }, []);

  const onQueryChange = (value: string) => {
    setQuery(value);
    measure(value.trim(), cat);
  };

  const onCatChange = (next: string) => {
    setCat(next);
    measure(kw, next);
  };

  /** `/` 聚焦、`Esc` 失焦（还原原型 keydown）*/
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') inputRef.current?.blur();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // 光标可见性：未聚焦且关键词为空时显示（还原原型 focus/blur 行为）
  const showCaret = !focused && query === '';

  return (
    <div className="relative z-[1] mx-auto max-w-[1080px] px-6">
      {/* hero search */}
      <section className="pb-7 pt-12">
        <div className="mb-2.5 font-mono text-[12px] tracking-[0.08em] text-acc">
          $ grep -ri &quot;关键词&quot; ./posts
        </div>
        <h1 className="mb-1.5 text-[clamp(26px,4vw,38px)] font-bold tracking-[-0.02em]">
          全站搜索
        </h1>
        <p className="mb-[22px] text-[15px] text-fg">
          128 篇文章，38.6 万字。按标题、正文、标签实时检索。
        </p>

        <label className="flex items-center gap-2.5 rounded-[10px] border border-line bg-panel px-4 py-3.5 font-mono transition-[.18s] focus-within:border-acc-dim focus-within:shadow-[0_0_0_3px_rgba(63,224,143,0.08)]">
          <span className="font-bold text-acc">tzblog ❯</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="试试 spec-first、缓存、Go、终端…"
            autoComplete="off"
            aria-label="搜索文章"
            className="min-w-0 flex-1 border-none bg-transparent font-mono text-[15px] text-fg outline-none placeholder:text-muted-foreground"
          />
          <span
            aria-hidden="true"
            className="h-[18px] w-2 bg-acc motion-safe:animate-[blink_1.1s_steps(1)_infinite]"
            style={{ display: showCaret ? 'block' : 'none' }}
          />
        </label>

        {/* filters */}
        <div className="mb-2 mt-[18px] flex flex-wrap gap-2">
          {CATS.map(({ cat: c, label }) => {
            const pressed = cat === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onCatChange(c)}
                aria-pressed={pressed}
                className={[
                  'rounded-full border px-[13px] py-[5px] font-mono text-[12px] transition-[.15s]',
                  pressed
                    ? 'border-acc-dim bg-panel2 text-acc'
                    : 'border-line bg-panel text-fg hover:border-muted-foreground hover:text-fg-strong',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* meta line */}
      <div
        className="mb-1.5 mt-3.5 font-mono text-[12px] text-muted-foreground"
        suppressHydrationWarning
      >
        &gt; 命中 <b className="text-acc">{list.length}</b> 篇 · {ms}ms
        {kw && ` · 关键词 "${kw}"`}
      </div>

      {/* results */}
      <section className="flex flex-col gap-0.5 pb-[60px]">
        {list.length ? (
          list.map((p, i) => (
            <Link
              key={`${p.t}-${i}`}
              href={HIT_HREF}
              className="group block rounded-[10px] border border-transparent px-4 py-[18px] transition-[.15s] hover:border-line hover:bg-panel"
            >
              <div className="mb-[5px] flex flex-wrap items-center gap-2.5">
                <span className="rounded-[5px] border border-acc-dim px-[7px] py-0.5 font-mono text-[11px] text-acc">
                  {p.c}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {p.d}
                </span>
              </div>
              <h3 className="text-[17px] font-semibold tracking-[-0.01em] transition-[.15s] group-hover:text-acc">
                {highlight(p.t, kw)}
              </h3>
              <p className="mt-1 text-[14px] text-fg">{highlight(p.x, kw)}</p>
              <div className="mt-2 flex gap-4 font-mono text-[11px] text-muted-foreground">
                <span>↗ {p.read}</span>
                <span>♥ {p.like}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="px-4 py-10 text-center font-mono text-muted-foreground">
            没有匹配 <b className="text-fg">&quot;{kw}&quot;</b> 的文章
            <br />
            试试更短的关键词，或换个分类
          </div>
        )}
      </section>
    </div>
  );
}
