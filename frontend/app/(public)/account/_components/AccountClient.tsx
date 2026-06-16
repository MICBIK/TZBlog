'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

/* ---------- 数据（1:1 照搬 account.html 内联 DATA / ICON）---------- */

type ViewKey = 'fav' | 'like' | 'cmt' | 'hist';

interface ListRow {
  readonly ti: string;
  readonly m: string;
}

const DATA: Record<ViewKey, readonly ListRow[]> = {
  fav: [
    { ti: 'spec-first：让 Claude 连续写对 3000 行代码', m: '收藏于 3 天前' },
    { ti: '把 Go 后端从 120ms 优化到 18ms', m: '收藏于 1 周前' },
    { ti: '用 Meilisearch 给博客加全文搜索', m: '收藏于 2 周前' },
  ],
  like: [
    { ti: 'Next.js 15 RSC 缓存踩过的 7 个坑', m: '赞于 5 天前' },
    { ti: '2026 我的终端配置：zsh + tmux + neovim', m: '赞于 2 周前' },
  ],
  cmt: [
    { ti: '在《spec-first》留言：受教了，spec 那段很有启发', m: '2 天前' },
    { ti: '在《Go 重写后端》留言：pprof 火焰图能展开讲讲吗？', m: '6 天前' },
  ],
  hist: [
    { ti: 'Shiki + KaTeX：博客代码与公式渲染管线', m: '刚刚读过' },
    { ti: 'Docker 多阶段构建把镜像砍到 40MB', m: '昨天' },
    { ti: '写完 100 篇博客后的一些反思', m: '3 天前' },
  ],
};

const ICON: Record<ViewKey, string> = { fav: '★', like: '♥', cmt: '❯', hist: '⟳' };

const STATS: ReadonlyArray<{ view: ViewKey; v: string; l: string }> = [
  { view: 'fav', v: '36', l: '收藏文章' },
  { view: 'like', v: '128', l: '点赞' },
  { view: 'cmt', v: '14', l: '评论' },
  { view: 'hist', v: '92', l: '阅读历史' },
];

const TABS: ReadonlyArray<{ view: ViewKey; label: string }> = [
  { view: 'fav', label: '收藏' },
  { view: 'like', label: '点赞' },
  { view: 'cmt', label: '评论' },
  { view: 'hist', label: '阅读历史' },
];

/* ---------- 本周签到条（Mon–Sun）：5 天已读，今日=周五，周末待签 ---------- */

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;
const WEEK_DONE = [true, true, true, true, false, false, false] as const;
const TODAY_IDX = 4;

/* ---------- 18 周阅读热力图：确定性 hash（刷新稳定），列主序 ---------- */

const HEAT_WEEKS = 18;

/** 模块级常量：确定性 hash，刷新稳定，无需 useMemo。*/
const HEAT_LEVELS: readonly number[] = (() => {
  const cells: number[] = [];
  for (let col = 0; col < HEAT_WEEKS; col++) {
    for (let row = 0; row < 7; row++) {
      const i = col * 7 + row;
      let h = Math.sin(i * 12.9898 + col * 1.31) * 43758.5453;
      h = h - Math.floor(h); // stable 0..1 hash
      const v =
        h + (row >= 5 ? 0.18 : 0) + (col > HEAT_WEEKS - 4 ? 0.22 : 0) - (col < 3 ? 0.2 : 0);
      const l = v > 1.02 ? 4 : v > 0.8 ? 3 : v > 0.58 ? 2 : v > 0.36 ? 1 : 0;
      cells.push(l);
    }
  }
  return cells;
})();

/** data-l 透明度映射（对照原型 .hc[data-l] 规则）*/
const HEAT_BG: Record<number, string> = {
  0: 'var(--panel-2)',
  1: 'rgba(63,224,143,.22)',
  2: 'rgba(63,224,143,.44)',
  3: 'rgba(63,224,143,.68)',
  4: 'rgba(63,224,143,.94)',
};

function heatCellStyle(level: number): React.CSSProperties {
  return {
    background: HEAT_BG[level],
    border: level === 0 ? '1px solid rgba(255,255,255,.025)' : undefined,
    boxShadow: level === 4 ? '0 0 6px rgba(63,224,143,.4)' : undefined,
  };
}

export function AccountClient() {
  const [view, setView] = useState<ViewKey>('fav');
  const [streak, setStreak] = useState(8);
  const [checkedIn, setCheckedIn] = useState(false);
  const rows = DATA[view];

  function handleCheckin() {
    if (checkedIn) return;
    setCheckedIn(true);
    setStreak((n) => n + 1);
    toast('签到成功 · 连续 9 天 — 再坚持 1 天解锁「九日连读」徽章');
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6">
      {/* 身份卡 — 设计稿 .pcard */}
      <section className="border-line flex flex-wrap items-center gap-5 rounded-[10px] border bg-[linear-gradient(180deg,var(--panel),var(--bg-2))] px-7 py-[26px]">
        <div className="border-acc-dim text-acc grid size-16 place-items-center rounded-[12px] border bg-[rgba(63,224,143,.1)] font-sans text-2xl font-bold">
          读
        </div>
        <div>
          <h1 className="text-fg-strong font-sans text-[22px] font-bold">读者 · reader_42</h1>
          <p className="text-muted mt-[3px] text-[13px]">
            via <span className="text-acc">GitHub OAuth</span> · reader42@github
          </p>
          <p className="text-dim mt-1.5 text-xs">
            注册于 2025-09-12 · 累计阅读 92 篇 · 全站排名前 8%
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2.5 max-[640px]:ml-0 max-[640px]:w-full">
          <button
            type="button"
            onClick={() => toast('编辑资料：昵称 / 头像 / 简介（mock）')}
            className="border-line2 text-fg hover:border-acc-dim hover:text-acc cursor-pointer rounded-[6px] border px-4 py-[9px] font-mono text-[13px] transition-[border-color,color] duration-[.16s]"
          >
            编辑资料
          </button>
          <button
            type="button"
            onClick={() =>
              toast('退出登录（mock）— 真实环境清除 session 后跳转首页')
            }
            className="border-line2 text-fg cursor-pointer rounded-[6px] border px-4 py-[9px] font-mono text-[13px] transition-[border-color,color] duration-[.16s] hover:border-[#ff7b9c] hover:text-[#ff7b9c]"
          >
            退出登录
          </button>
        </div>
      </section>

      {/* 签到模块 — 设计稿 .panel + .ci */}
      <section className="border-line my-[22px] rounded-[10px] border bg-[linear-gradient(180deg,var(--panel),var(--bg-2))] px-[22px] py-5">
        <div className="mb-[18px] flex items-center gap-2.5">
          <span className="text-acc font-bold">$</span>
          <h2 className="text-fg-strong font-mono text-sm font-bold tracking-[.01em]">
            checkin --streak
          </h2>
          <span className="text-dim ml-auto text-[11.5px]">每日签到 · 解锁连读徽章</span>
        </div>
        <div className="flex flex-wrap items-center gap-[30px] max-[640px]:gap-5">
          <div className="flex items-baseline gap-[9px]">
            <span
              className="text-acc font-mono text-[40px] font-bold leading-none [font-variant-numeric:tabular-nums]"
              style={{ textShadow: '0 0 18px rgba(63,224,143,.35)' }}
            >
              {streak}
            </span>
            <span className="text-muted text-[13px]">
              天
              <br />
              连续签到
            </span>
          </div>
          <div className="flex gap-2">
            {WEEK_LABELS.map((label, i) => {
              const done = WEEK_DONE[i];
              const isToday = i === TODAY_IDX;
              const showDone = done || (isToday && checkedIn);
              const mark = showDone ? '✓' : isToday ? '·' : '';
              return (
                <div
                  key={label}
                  className="text-dim flex flex-col items-center gap-[7px] text-[10.5px]"
                >
                  <span
                    className={cn(
                      'grid size-[30px] place-items-center rounded-[8px] border font-mono text-[11px] transition-[.16s]',
                      showDone
                        ? 'border-acc-dim text-acc bg-[rgba(63,224,143,.16)]'
                        : 'border-line2 text-muted',
                      isToday && 'border-acc text-fg-strong',
                    )}
                    style={
                      isToday
                        ? { boxShadow: '0 0 0 3px rgba(63,224,143,.12)' }
                        : undefined
                    }
                  >
                    {mark}
                  </span>
                  {label}
                </div>
              );
            })}
          </div>
          <div className="ml-auto max-[640px]:ml-0 max-[640px]:w-full">
            <button
              type="button"
              onClick={handleCheckin}
              disabled={checkedIn}
              className="border-acc-dim text-acc cursor-pointer rounded-[6px] border bg-[rgba(63,224,143,.08)] px-4 py-[9px] font-mono text-[13px] transition-[.16s] hover:bg-[rgba(63,224,143,.14)] disabled:cursor-default disabled:opacity-70 max-[640px]:w-full"
            >
              {checkedIn ? '✓ 今日已签' : '签到'}
            </button>
          </div>
        </div>
      </section>

      {/* 阅读热力图 — 签名模块 .panel + .heat */}
      <section className="border-line my-[22px] rounded-[10px] border bg-[linear-gradient(180deg,var(--panel),var(--bg-2))] px-[22px] py-5">
        <div className="mb-[18px] flex items-center gap-2.5">
          <span className="text-acc font-bold">$</span>
          <h2 className="text-fg-strong font-mono text-sm font-bold tracking-[.01em]">
            git log --reading
          </h2>
          <span className="text-dim ml-auto text-[11.5px]">最近 18 周 · 共 92 次阅读</span>
        </div>
        <div className="overflow-x-auto pb-1.5">
          <div
            className="grid min-w-max grid-flow-col grid-rows-7 gap-[3px]"
            role="img"
            aria-label="最近 18 周阅读热力图"
          >
            {HEAT_LEVELS.map((level, i) => (
              <span
                key={i}
                className="size-[13px] rounded-[3px] transition-transform duration-100 hover:scale-125 motion-reduce:transform-none"
                style={heatCellStyle(level)}
              />
            ))}
          </div>
        </div>
        <div className="text-dim mt-3.5 flex items-center justify-end gap-1.5 text-[11px]">
          少
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className="size-[13px] rounded-[3px]"
              style={heatCellStyle(l)}
            />
          ))}
          多
        </div>
      </section>

      {/* 可点统计盒 ×4 — 与 tab 经 selectView 联动 .stats */}
      <div
        className="mb-2 mt-[22px] grid grid-cols-4 gap-3.5 max-[640px]:grid-cols-2"
        role="tablist"
        aria-label="我的内容"
      >
        {STATS.map((s) => {
          const on = view === s.view;
          return (
            <button
              key={s.view}
              type="button"
              onClick={() => setView(s.view)}
              className={cn(
                'group rounded-[8px] border bg-[var(--panel)] px-[18px] py-4 text-left font-mono transition-[.16s] hover:-translate-y-0.5',
                on
                  ? 'border-acc bg-[rgba(63,224,143,.06)]'
                  : 'border-line hover:border-acc-dim hover:bg-panel2',
              )}
            >
              <div className="text-acc text-2xl font-bold [font-variant-numeric:tabular-nums]">
                {s.v}
              </div>
              <div
                className={cn(
                  'text-muted mt-1 flex items-center gap-1.5 text-xs',
                  "after:ml-auto after:text-[15px] after:transition-[.16s] after:content-['›'] group-hover:after:text-acc group-hover:after:translate-x-0.5",
                  on ? 'after:text-acc after:translate-x-0.5' : 'after:text-dim',
                )}
              >
                {s.l}
              </div>
            </button>
          );
        })}
      </div>

      {/* tab — 设计稿 .tabs */}
      <div className="border-line mb-[18px] mt-1.5 flex flex-wrap gap-1.5 border-b" role="tablist">
        {TABS.map((t) => {
          const on = view === t.view;
          return (
            <button
              key={t.view}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setView(t.view)}
              className={cn(
                '-mb-px cursor-pointer border-0 border-b-2 bg-transparent px-3.5 py-[9px] font-mono text-[13.5px] transition-[.15s]',
                on
                  ? 'text-acc border-acc'
                  : 'text-muted border-transparent hover:text-fg-strong',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 列表 — 设计稿 .list */}
      <div aria-live="polite">
        {rows.length === 0 ? (
          <p className="text-dim py-[46px] text-center font-sans text-sm">
            <span className="text-acc-dim font-mono">$</span> 这里还空着 — 去首页逛逛吧。
          </p>
        ) : (
          rows.map((r, i) => (
            <Link
              key={i}
              href="/articles/tutorial"
              className="border-line group/row hover:border-acc-dim hover:bg-panel2 mb-2.5 flex items-center gap-3.5 rounded-[8px] border bg-[var(--panel)] px-3.5 py-[13px] transition-[.16s] hover:translate-x-[3px]"
            >
              <span className="text-acc-dim font-mono">{ICON[view]}</span>
              <span className="text-fg group-hover/row:text-acc font-sans text-[14.5px]">
                {r.ti}
              </span>
              <span className="text-dim ml-auto whitespace-nowrap text-[11.5px]">
                {r.m}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
