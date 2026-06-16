'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';

import { adminToast } from '../../_components/adminToast';
import { ripple } from '../../_components/ripple';

/** 内容板块 / 分类行模型。 */
interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
  color: string;
  visible: boolean;
  /** 原型里运行时新增的板块无「编辑」按钮，仅初始 5 条有。 */
  builtin: boolean;
}

/** 首页置顶候选文章。 */
interface PinItem {
  title: string;
  meta: string;
}

const INITIAL_CATS: Category[] = [
  { id: 1, name: 'AI Coding', slug: 'ai-coding', count: 42, color: '#3fe08f', visible: true, builtin: true },
  { id: 2, name: '全栈工程', slug: 'fullstack', count: 38, color: '#56a8e8', visible: true, builtin: true },
  { id: 3, name: '工具效率', slug: 'tools', count: 24, color: '#e8b339', visible: true, builtin: true },
  { id: 4, name: '随笔思考', slug: 'essay', count: 15, color: '#b07ce8', visible: true, builtin: true },
  { id: 5, name: '作品项目', slug: 'works', count: 9, color: '#e06a5a', visible: true, builtin: true },
];

const PINS: PinItem[] = [
  { title: 'spec-first 让 Claude 连续写对 3000 行', meta: 'AI Coding · 2026-05-20 · 阅读 3.2k' },
  { title: 'Next.js 15 RSC 缓存的 7 个坑', meta: '全栈工程 · 2026-05-12 · 阅读 2.7k' },
  { title: 'Go 重写后端：120ms → 18ms', meta: '全栈工程 · 2026-04-28 · 阅读 4.1k' },
  { title: '写完 100 篇博客后的反思', meta: '随笔思考 · 2026-04-15 · 阅读 1.9k' },
];

// 共用按钮基础态 —— 1:1 还原原型 .btn。
const BTN_BASE =
  'relative inline-flex cursor-pointer items-center gap-[6px] overflow-hidden rounded-[7px] border ' +
  'border-line bg-panel font-mono text-[12.5px] text-[#aab3c0] transition-all duration-150 ' +
  'hover:border-[#46505e] hover:text-fg';
const BTN_SM = 'px-[9px] py-[5px] text-[11.5px]';
const BTN_PRIMARY =
  'border-acc-dim bg-[rgba(63,224,143,0.12)] text-acc hover:bg-[rgba(63,224,143,0.18)] hover:border-acc-dim hover:text-acc';
const BTN_DGR =
  'border-[rgba(224,106,90,0.35)] text-[#e06a5a] hover:bg-[rgba(224,106,90,0.08)] hover:text-[#e06a5a]';

let nextId = 100;

export function SectionsClient() {
  const [cats, setCats] = useState<Category[]>(INITIAL_CATS);
  const [pinned, setPinned] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [dirty, setDirty] = useState(false);

  function mark() {
    setDirty(true);
  }

  function save() {
    setDirty(false);
    adminToast('板块与置顶已保存');
  }

  function toggleAdd() {
    setAddOpen((v) => !v);
  }

  function addCat() {
    const n = newName.trim();
    const s = newSlug.trim() || 'new';
    if (!n) {
      adminToast('请填写板块名称');
      return;
    }
    setCats((prev) => [
      ...prev,
      { id: nextId++, name: n, slug: s, count: 0, color: '#6b7686', visible: true, builtin: false },
    ]);
    setNewName('');
    setNewSlug('');
    setAddOpen(false);
    mark();
    adminToast('已新增板块「' + n + '」');
  }

  function delCat(id: number) {
    setCats((prev) => prev.filter((c) => c.id !== id));
    mark();
    adminToast('板块已删除');
  }

  function toggleVisible(id: number) {
    setCats((prev) => prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));
    mark();
  }

  function pick(i: number) {
    setPinned(i);
    mark();
    adminToast('已设为首页置顶');
  }

  const rip =
    (fn?: () => void) =>
    (e: MouseEvent<HTMLButtonElement>) => {
      ripple(e);
      fn?.();
    };

  return (
    <div className="flex h-screen min-w-0 flex-col overflow-y-auto">
      {/* .top 顶栏 */}
      <header className="sticky top-0 z-[5] flex items-center justify-between border-b border-line bg-[rgba(13,18,25,0.7)] px-[26px] py-[14px] backdrop-blur-[8px]">
        <div className="font-mono text-[12px] text-[#6b7686]">
          admin ❯ <b className="font-normal text-[#aab3c0]">sections</b>
        </div>
        <div className="flex items-center gap-[10px]">
          <Link href="/" className={`${BTN_BASE} px-[13px] py-[7px]`}>
            ↗ 预览首页
          </Link>
          <button type="button" onClick={rip(save)} className={`${BTN_BASE} ${BTN_PRIMARY} px-[13px] py-[7px]`}>
            ✓ 保存更改
          </button>
        </div>
      </header>

      <div className="w-full max-w-[920px] px-[26px] pb-10 pt-6">
        {/* 内容板块 / 分类 */}
        <section className="mb-[18px] overflow-hidden rounded-[11px] border border-line bg-panel">
          <div className="flex items-center gap-[9px] border-b border-line px-[18px] py-[13px]">
            <span className="font-mono text-[12.5px] text-[#aab3c0]">
              <b className="font-normal text-acc">#</b> 内容板块 / 分类
            </span>
            <span className="font-mono text-[11px] text-[#6b7686]">前台导航与归类依据</span>
            <button
              type="button"
              onClick={rip(toggleAdd)}
              className={`${BTN_BASE} ${BTN_PRIMARY} ${BTN_SM} ml-auto`}
            >
              + 新增板块
            </button>
          </div>

          {/* 新增表单 */}
          {addOpen && (
            <div className="flex flex-wrap items-center gap-[10px] border-b border-line bg-panel-2 px-[18px] py-[14px]">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="板块名称，如「性能优化」"
                className="min-w-[140px] flex-1 rounded-[7px] border border-line bg-bg px-[11px] py-[8px] font-mono text-[12.5px] text-fg outline-none focus:border-acc-dim"
              />
              <input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="slug，如 perf"
                className="w-[150px] rounded-[7px] border border-line bg-bg px-[11px] py-[8px] font-mono text-[12.5px] text-fg outline-none focus:border-acc-dim"
              />
              <button type="button" onClick={rip(addCat)} className={`${BTN_BASE} ${BTN_PRIMARY} ${BTN_SM}`}>
                确定
              </button>
              <button type="button" onClick={rip(toggleAdd)} className={`${BTN_BASE} ${BTN_SM}`}>
                取消
              </button>
            </div>
          )}

          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['板块', 'Slug', '文章数', '前台显示', ''].map((h, i) => (
                  <th
                    key={i}
                    className="border-b border-line px-[18px] py-[10px] text-left font-mono text-[10.5px] uppercase tracking-[0.08em] text-[#46505e]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-panel-2 transition-colors last:border-b-0 hover:bg-panel-2"
                >
                  <td className="px-[18px] py-[12px] align-middle text-[13px]">
                    <div className="flex items-center gap-[9px]">
                      <span
                        className="h-[10px] w-[10px] flex-none rounded-[3px]"
                        style={{ background: c.color }}
                      />
                      {c.name}
                    </div>
                  </td>
                  <td className="px-[18px] py-[12px] align-middle text-[13px]">
                    <span className="font-mono text-[11.5px] text-[#6b7686]">{c.slug}</span>
                  </td>
                  <td className="px-[18px] py-[12px] align-middle text-[13px]">
                    <span className="font-mono tabular-nums text-[#aab3c0]">{c.count}</span>
                  </td>
                  <td className="px-[18px] py-[12px] align-middle text-[13px]">
                    <VisibilitySwitch checked={c.visible} onChange={() => toggleVisible(c.id)} />
                  </td>
                  <td className="whitespace-nowrap px-[18px] py-[12px] text-right align-middle text-[13px]">
                    {c.builtin && (
                      <button
                        type="button"
                        onClick={rip(() => adminToast('编辑板块（原型占位）'))}
                        className={`${BTN_BASE} ${BTN_SM}`}
                      >
                        编辑
                      </button>
                    )}{' '}
                    <button
                      type="button"
                      onClick={rip(() => delCat(c.id))}
                      className={`${BTN_BASE} ${BTN_DGR} ${BTN_SM}`}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 首页置顶 */}
        <section className="mb-[18px] overflow-hidden rounded-[11px] border border-line bg-panel">
          <div className="flex items-center gap-[9px] border-b border-line px-[18px] py-[13px]">
            <span className="font-mono text-[12.5px] text-[#aab3c0]">
              <b className="font-normal text-acc">★</b> 首页置顶文章
            </span>
            <span className="font-mono text-[11px] text-[#6b7686]">选择 1 篇展示在首页顶部</span>
          </div>
          <div className="py-[6px]">
            {PINS.map((p, i) => {
              const on = pinned === i;
              return (
                <div
                  key={i}
                  onClick={() => pick(i)}
                  className={`flex cursor-pointer items-center gap-[13px] border-b border-panel-2 px-[18px] py-[12px] transition-colors last:border-b-0 hover:bg-panel-2 ${on ? 'bg-[rgba(63,224,143,0.07)]' : ''}`}
                >
                  <span
                    className={`grid h-[16px] w-[16px] flex-none place-items-center rounded-full border-[1.5px] transition-all duration-150 ${on ? 'border-acc' : 'border-[#46505e]'}`}
                  >
                    {on && (
                      <span className="h-[8px] w-[8px] rounded-full bg-acc shadow-[0_0_6px_var(--acc)]" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium text-fg">{p.title}</div>
                    <div className="mt-[2px] font-mono text-[11px] text-[#6b7686]">{p.meta}</div>
                  </div>
                  <span
                    className={`rounded-[5px] border border-[rgba(232,179,57,0.4)] px-[7px] py-[2px] font-mono text-[10px] text-[#e8b339] transition-opacity duration-150 ${on ? 'opacity-100' : 'opacity-0'}`}
                  >
                    ★ 当前置顶
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 保存条 */}
      <div className="sticky bottom-0 flex items-center justify-between border-t border-line bg-[rgba(13,18,25,0.85)] px-[26px] py-[13px] backdrop-blur-[8px]">
        <span className="font-mono text-[11.5px] text-[#6b7686]">
          {dirty ? (
            <b className="font-normal text-[#e8b339]">● 有未保存的更改</b>
          ) : (
            '已保存 · 最后更新 5 分钟前'
          )}
        </span>
        <button type="button" onClick={rip(save)} className={`${BTN_BASE} ${BTN_PRIMARY} px-[13px] py-[7px]`}>
          ✓ 保存更改
        </button>
      </div>
    </div>
  );
}

/** 前台显示开关 —— 1:1 还原原型 .switch（隐藏 checkbox + 轨道 + 滑块）。 */
function VisibilitySwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="relative inline-block h-[22px] w-[40px] cursor-pointer align-middle">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0" />
      <span className="absolute inset-0 rounded-[12px] border border-line bg-panel-2 transition-all duration-[180ms] peer-checked:border-acc-dim peer-checked:bg-[rgba(63,224,143,0.15)]" />
      <span className="absolute left-[3px] top-[3px] h-[14px] w-[14px] rounded-full bg-[#6b7686] transition-all duration-[180ms] peer-checked:left-[20px] peer-checked:bg-acc peer-checked:shadow-[0_0_6px_var(--acc)]" />
    </label>
  );
}
