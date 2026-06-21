'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { getCategories } from '@/lib/api/category';
import { searchArticles } from '@/lib/api/search';
import type { ArticleSummary, Category } from '@/types/article';

/** 分类 chip */
interface CatChip {
  readonly slug: string;
  readonly label: string;
}

const ALL_CAT: CatChip = { slug: 'all', label: '全部' };

/** 关键词高亮 — React 自动转义，仅切分包裹 <mark> */
function highlight(text: string, kw: string) {
  if (!kw) return text;
  const safe = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safe})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === kw.toLowerCase() ? (
      <mark key={i} className="rounded-[2px] bg-acc/[0.16] px-0.5 text-acc">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 全站搜索（接后端真实数据）。
 * 关键词 → GET /articles?search=...（后端按 title/content 检索），分类 → category slug 过滤。
 * 每条结果链接到自身真实 slug（此前原型把所有命中都指向同一篇文章）。
 */
interface SearchClientProps {
  initialQuery?: string;
  initialCategory?: string;
}

export function SearchClient({
  initialQuery = '',
  initialCategory = 'all',
}: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const [ms, setMs] = useState('0.00');
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const kw = query.trim();
  const cat = searchParams.get('category') ?? initialCategory;

  // 真实分类列表（拉取失败不阻塞搜索）
  useEffect(() => {
    let active = true;
    getCategories()
      .then((cats) => {
        if (active) setCategories(cats);
      })
      .catch(() => {
        /* 忽略：分类不可用时仅保留“全部” */
      });
    return () => {
      active = false;
    };
  }, []);

  const cats = useMemo<CatChip[]>(
    () => [ALL_CAT, ...categories.map((c) => ({ slug: c.slug, label: c.name }))],
    [categories],
  );

  // 关键词 + 分类 → 后端真实检索（debounce 250ms）
  useEffect(() => {
    let active = true;
    const handle = setTimeout(async () => {
      const t0 = performance.now();
      setLoading(true);
      setError('');
      try {
        const { items } = await searchArticles({
          q: kw,
          category: cat === 'all' ? undefined : cat,
          limit: 30,
        });
        if (!active) return;
        setResults(items);
      } catch (err) {
        if (!active) return;
        setResults([]);
        setError(err instanceof Error ? err.message : '搜索失败，请稍后重试');
      } finally {
        if (active) {
          setLoading(false);
          setMs((performance.now() - t0).toFixed(2));
        }
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [kw, cat]);

  useEffect(() => {
    const currentQuery = searchParams.get('q') ?? '';
    const currentCategory = searchParams.get('category') ?? 'all';
    if (currentQuery === kw && currentCategory === cat) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (kw) {
      params.set('q', kw);
    } else {
      params.delete('q');
    }

    if (cat !== 'all') {
      params.set('category', cat);
    } else {
      params.delete('category');
    }

    const next = params.toString();
    router.replace(next ? `/search?${next}` : '/search', { scroll: false });
  }, [cat, initialCategory, kw, router, searchParams]);

  // `/` 聚焦、`Esc` 失焦
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

  const showCaret = !focused && query === '';

  function updateCategory(nextCategory: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextCategory !== 'all') {
      params.set('category', nextCategory);
    } else {
      params.delete('category');
    }

    const next = params.toString();
    router.replace(next ? `/search?${next}` : '/search', { scroll: false });
  }

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
          按标题、正文、标签实时检索。
        </p>

        <label className="flex items-center gap-2.5 rounded-[10px] border border-line bg-panel px-4 py-3.5 font-mono transition-[.18s] focus-within:border-acc-dim focus-within:shadow-[0_0_0_3px_rgba(63,224,143,0.08)]">
          <span className="font-bold text-acc">tzblog ❯</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
          {cats.map(({ slug, label }) => {
            const pressed = cat === slug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => updateCategory(slug)}
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
        &gt; 命中 <b className="text-acc">{results.length}</b> 篇 · {ms}ms
        {kw && ` · 关键词 "${kw}"`}
      </div>

      {/* results */}
      <section className="flex flex-col gap-0.5 pb-[60px]">
        {loading ? (
          <div className="px-4 py-10 text-center font-mono text-muted-foreground">
            检索中…
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center font-mono text-muted-foreground">
            {error}
          </div>
        ) : results.length ? (
          results.map((p) => (
            <Link
              key={p.id}
              href={`/articles/${p.slug}`}
              className="group block rounded-[10px] border border-transparent px-4 py-[18px] transition-[.15s] hover:border-line hover:bg-panel"
            >
              <div className="mb-[5px] flex flex-wrap items-center gap-2.5">
                {p.publishedAt && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {formatDate(p.publishedAt)}
                  </span>
                )}
              </div>
              <h3 className="text-[17px] font-semibold tracking-[-0.01em] transition-[.15s] group-hover:text-acc">
                {highlight(p.title, kw)}
              </h3>
              {p.summary && (
                <p className="mt-1 text-[14px] text-fg">
                  {highlight(p.summary, kw)}
                </p>
              )}
              <div className="mt-2 flex gap-4 font-mono text-[11px] text-muted-foreground">
                <span>↗ {p.readingTime} min</span>
                <span>♥ {p.likeCount}</span>
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
