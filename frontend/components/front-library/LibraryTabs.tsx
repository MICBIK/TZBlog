'use client';

import Link from 'next/link';
import { useState } from 'react';

type ViewKey = 'arc' | 'shelf';

interface ArchiveRow {
  readonly date: string;
  readonly title: string;
  readonly cat: string;
  readonly href: string;
}

interface ArchiveYear {
  readonly year: string;
  readonly count: string;
  readonly rows: readonly ArchiveRow[];
}

type BookStatus = 'done' | 'now' | 'want';

interface Book {
  readonly spine: string;
  readonly title: string;
  readonly author: string;
  readonly status: BookStatus;
  readonly statusLabel: string;
}

/** 归档数据（1:1 照搬原型 #arc，按年份倒序分组，含中文文案）*/
const ARCHIVE: readonly ArchiveYear[] = [
  {
    year: '2026',
    count: '— 9 篇',
    rows: [
      {
        date: '05-28',
        title: 'spec-first 让 Claude 连续写对 3000 行',
        cat: 'AI Coding',
        href: '/articles/spec-first-workflow',
      },
      {
        date: '05-12',
        title: 'Next.js 15 RSC 缓存的 7 个坑',
        cat: '全栈',
        href: '/articles/rsc-cache-7-traps',
      },
      {
        date: '04-30',
        title: 'Go 重写后端：P99 从 120ms 到 18ms',
        cat: '全栈',
        href: '/articles/go-rewrite-p99',
      },
      {
        date: '04-08',
        title: '2026 我的终端配置：zsh + starship + tmux',
        cat: '工具',
        href: '/articles/terminal-setup-2026',
      },
      {
        date: '03-15',
        title: '用 Meilisearch 给博客加全文搜索',
        cat: '全栈',
        href: '/articles/meilisearch-blog-search',
      },
      {
        date: '02-20',
        title: '写完 100 篇博客后的一些反思',
        cat: '随笔',
        href: '/articles/100-posts-reflection',
      },
    ],
  },
  {
    year: '2025',
    count: '— 14 篇',
    rows: [
      {
        date: '12-18',
        title: 'Docker 多阶段构建把镜像砍到 40MB',
        cat: '全栈',
        href: '/articles/docker-multi-stage-40mb',
      },
      {
        date: '11-02',
        title: 'Shiki + KaTeX：博客代码与公式渲染管线',
        cat: '工具',
        href: '/articles/shiki-katex-pipeline',
      },
      {
        date: '09-24',
        title: '从 0 搭一个能用三年的个人博客架构',
        cat: '全栈',
        href: '/articles/blog-architecture-3-years',
      },
      {
        date: '06-11',
        title: '为什么我把笔记从 Notion 搬回纯文本',
        cat: '随笔',
        href: '/articles/notion-to-plaintext',
      },
    ],
  },
  {
    year: '2024',
    count: '— 18 篇',
    rows: [
      {
        date: '10-09',
        title: '第一次用 LLM 写代码的踩坑记录',
        cat: 'AI Coding',
        href: '/articles/first-llm-coding',
      },
      {
        date: '07-21',
        title: '独立开发者的第一年：收入与教训',
        cat: '随笔',
        href: '/articles/indie-dev-first-year',
      },
    ],
  },
];

/** 书架数据（1:1 照搬原型 #shelf .book，含中文文案与状态）*/
const BOOKS: readonly Book[] = [
  {
    spine: 'DDIA',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    status: 'done',
    statusLabel: '读完 · 推荐',
  },
  {
    spine: 'SRE',
    title: 'Site Reliability Engineering',
    author: 'Google',
    status: 'done',
    statusLabel: '读完',
  },
  {
    spine: '重构',
    title: '重构：改善既有代码的设计（2 版）',
    author: 'Martin Fowler',
    status: 'done',
    statusLabel: '读完 · 推荐',
  },
  {
    spine: 'CSAPP',
    title: '深入理解计算机系统',
    author: "Bryant & O'Hallaron",
    status: 'now',
    statusLabel: '在读 · 第 6 章',
  },
  {
    spine: 'Pragm',
    title: '程序员修炼之道（20 周年版）',
    author: 'Hunt & Thomas',
    status: 'done',
    statusLabel: '读完',
  },
  {
    spine: 'SICP',
    title: '计算机程序的构造和解释',
    author: 'Abelson & Sussman',
    status: 'want',
    statusLabel: '想读',
  },
];

/** 书籍状态徽标配色（还原原型 .bstatus.done/.now/.want）*/
const BSTATUS_CLASS: Record<BookStatus, string> = {
  done: 'text-acc border-acc-dim bg-acc/[0.08]',
  now: 'text-amber border-[#5a4a1f] bg-amber/[0.08]',
  want: 'text-muted-foreground border-line',
};

const TABS: readonly { v: ViewKey; label: string }[] = [
  { v: 'arc', label: '归档 / 41 篇' },
  { v: 'shelf', label: '书架 / 18 本' },
];

export function LibraryTabs() {
  const [view, setView] = useState<ViewKey>('arc');

  return (
    <>
      {/* TAB 切换（还原原型 .tabs，点击切换 .view.on）*/}
      <div className="flex gap-[6px] pb-[30px] pt-[6px] font-mono">
        {TABS.map((tab) => {
          const on = view === tab.v;
          return (
            <button
              key={tab.v}
              type="button"
              onClick={() => setView(tab.v)}
              aria-pressed={on}
              className={
                'cursor-pointer rounded-[6px] border px-4 py-[7px] text-[13px] transition-[border-color,color,background-color] duration-150 ease-out ' +
                (on
                  ? 'border-acc bg-acc font-semibold text-[#06140c]'
                  : 'border-line bg-panel text-dim hover:border-acc-dim hover:text-fg')
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 归档视图 */}
      <section className={(view === 'arc' ? 'block' : 'hidden') + ' pb-[60px]'}>
        {ARCHIVE.map((group) => (
          <div key={group.year}>
            <div className="mb-3 mt-[26px] flex items-center gap-[10px] font-mono text-[14px] text-acc">
              <span className="h-[6px] w-[6px] flex-[0_0_6px] rounded-full bg-acc" />
              {group.year}
              <span className="text-[12px] font-normal text-muted-foreground">
                {group.count}
              </span>
            </div>
            {group.rows.map((row) => (
              <Link
                key={`${group.year}-${row.date}-${row.title}`}
                href={row.href}
                className="group flex items-baseline gap-[14px] rounded-[7px] border border-transparent px-3 py-[9px] transition-[background-color,border-color] duration-150 ease-out hover:border-line hover:bg-panel"
              >
                <span className="flex-[0_0_52px] font-mono text-[12.5px] text-muted-foreground">
                  {row.date}
                </span>
                <span className="flex-1 text-[15px] text-fg transition-colors group-hover:text-acc">
                  {row.title}
                </span>
                <span className="rounded-[5px] bg-panel2 px-2 py-[2px] font-mono text-[11px] text-dim">
                  {row.cat}
                </span>
              </Link>
            ))}
          </div>
        ))}
      </section>

      {/* 书架视图 */}
      <section
        className={(view === 'shelf' ? 'block' : 'hidden') + ' pb-[60px]'}
      >
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
          {BOOKS.map((book) => (
            <article
              key={book.title}
              className="flex gap-[14px] rounded-[10px] border border-line bg-panel p-4 transition-[border-color,transform] duration-200 ease-out hover:-translate-y-[2px] hover:border-acc-dim"
            >
              <div className="flex h-[62px] flex-[0_0_44px] items-end justify-center rounded-[3px] border-l-[3px] border-acc bg-[linear-gradient(160deg,var(--panel-2),var(--line))] pb-[6px] font-mono text-[10px] text-muted-foreground">
                {book.spine}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-[3px] text-[14.5px] font-semibold leading-[1.35] text-fg">
                  {book.title}
                </div>
                <div className="mb-2 text-[12.5px] text-muted-foreground">
                  {book.author}
                </div>
                <span
                  className={
                    'rounded-[20px] border px-2 py-[2px] font-mono text-[11px] ' +
                    BSTATUS_CLASS[book.status]
                  }
                >
                  {book.statusLabel}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
