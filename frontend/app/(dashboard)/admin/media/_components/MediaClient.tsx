'use client';

import { useState } from 'react';

import { adminToast } from '../../_components/adminToast';
import { ripple } from '../../_components/ripple';

/**
 * 媒体库 —— 1:1 还原原型 admin-media.html。
 * 存储用量条 + 拖拽上传区 + 分类过滤 chip + 媒体网格。
 * 交互：chip 过滤切换、按钮磷光绿涟漪、复制 URL / 删除 / 上传 toast。
 * 终端暗色美学：近黑画布 + 单磷光绿 #3fe08f(@theme token) + 等宽骨架。
 */

type MediaFilter = 'all' | 'cover' | 'shot' | 'diagram' | 'other';

interface MediaItem {
  fn: string;
  ty: string;
  f: Exclude<MediaFilter, 'all'>;
  ext: string;
  dim: string;
  sz: string;
  c1: string;
  c2: string;
}

const MEDIA: MediaItem[] = [
  { fn: 'spec-first-cover.webp', ty: '封面', f: 'cover', ext: 'WEBP', dim: '1600×900', sz: '182 KB', c1: '#14323a', c2: '#0e1f26' },
  { fn: 'rsc-cache-flow.svg', ty: '图表', f: 'diagram', ext: 'SVG', dim: '矢量', sz: '24 KB', c1: '#1a2b3d', c2: '#0f1a26' },
  { fn: 'go-flamegraph.png', ty: '截图', f: 'shot', ext: 'PNG', dim: '2048×1280', sz: '612 KB', c1: '#2a1f14', c2: '#1c1410' },
  { fn: 'ghostty-terminal.webp', ty: '封面', f: 'cover', ext: 'WEBP', dim: '1600×900', sz: '201 KB', c1: '#0f2a1e', c2: '#0a1c14' },
  { fn: 'meilisearch-arch.svg', ty: '图表', f: 'diagram', ext: 'SVG', dim: '矢量', sz: '31 KB', c1: '#241a33', c2: '#16101f' },
  { fn: 'blog-100-cover.jpg', ty: '封面', f: 'cover', ext: 'JPG', dim: '1600×900', sz: '258 KB', c1: '#33261a', c2: '#1f1710' },
  { fn: 'docker-layers.png', ty: '截图', f: 'shot', ext: 'PNG', dim: '1920×1080', sz: '487 KB', c1: '#14283a', c2: '#0d1925' },
  { fn: 'rsc-waterfall.png', ty: '截图', f: 'shot', ext: 'PNG', dim: '2048×1024', sz: '556 KB', c1: '#1f1432', c2: '#140d20' },
  { fn: 'zsh-config-diff.png', ty: '截图', f: 'shot', ext: 'PNG', dim: '1680×1050', sz: '398 KB', c1: '#0f2a2a', c2: '#0a1c1c' },
  { fn: 'katex-render.svg', ty: '图表', f: 'diagram', ext: 'SVG', dim: '矢量', sz: '18 KB', c1: '#2a1422', c2: '#1c0d16' },
  { fn: 'avatar-haiden.png', ty: '其他', f: 'other', ext: 'PNG', dim: '512×512', sz: '46 KB', c1: '#1a2333', c2: '#111824' },
  { fn: 'og-default.webp', ty: '其他', f: 'other', ext: 'WEBP', dim: '1200×630', sz: '94 KB', c1: '#14323a', c2: '#0e1f26' },
];

const FILTERS: { f: MediaFilter; label: string }[] = [
  { f: 'all', label: '全部 142' },
  { f: 'cover', label: '文章封面 48' },
  { f: 'shot', label: '截图 61' },
  { f: 'diagram', label: '图表 / SVG 24' },
  { f: 'other', label: '其他 9' },
];

export function MediaClient() {
  const [active, setActive] = useState<MediaFilter>('all');

  const visible = MEDIA.filter((m) => active === 'all' || m.f === active);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-[5] flex items-center justify-between border-b border-line bg-[rgba(13,18,25,0.7)] px-[26px] py-[14px] backdrop-blur-[8px]">
        <div className="font-mono text-[12px] text-dim">
          admin ❯ <b className="font-normal text-[#aab3c0]">media</b>
        </div>
        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            onClick={(e) => {
              ripple(e);
              adminToast('已复制 CDN 基址 cdn.tzcode.top');
            }}
            className="relative inline-flex items-center gap-[6px] overflow-hidden rounded-[7px] border border-line bg-panel px-[13px] py-[7px] font-mono text-[12.5px] text-[#aab3c0] transition-[.15s] hover:border-[#46505e] hover:text-fg"
          >
            ⎘ CDN 基址
          </button>
          <button
            type="button"
            onClick={(e) => {
              ripple(e);
              adminToast('选择文件上传…');
            }}
            className="relative inline-flex items-center gap-[6px] overflow-hidden rounded-[7px] border border-acc-dim bg-acc/12 px-[13px] py-[7px] font-mono text-[12.5px] text-acc transition-[.15s] hover:bg-acc/[0.18]"
          >
            ＋ 上传素材
          </button>
        </div>
      </header>

      <div className="w-full max-w-[1180px] px-[26px] pb-10 pt-6">
        {/* storage usage */}
        <div className="mb-[18px] flex flex-wrap items-center gap-x-[22px] gap-y-3 rounded-[11px] border border-line bg-panel px-[18px] py-4">
          <div>
            <div className="mb-[6px] font-mono text-[11px] text-dim">存储用量</div>
            <div className="font-mono text-[20px] font-semibold">
              1.34<small className="text-[13px] font-normal text-[#aab3c0]"> GB</small>{' '}
              <small className="text-[13px] font-normal text-dim">/ 4 GB</small>
            </div>
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="mt-2 h-2 overflow-hidden rounded-[5px] bg-panel-2">
              <div className="h-full w-[34%] rounded-[5px] bg-[linear-gradient(90deg,var(--acc-dim),var(--acc))] shadow-[0_0_8px_rgba(63,224,143,0.3)]" />
            </div>
            <div className="mt-2 flex gap-[14px] font-mono text-[11px] text-dim">
              <span>图片 <i className="not-italic text-[#aab3c0]">1.02 GB</i></span>
              <span>SVG <i className="not-italic text-[#aab3c0]">86 MB</i></span>
              <span>其他 <i className="not-italic text-[#aab3c0]">238 MB</i></span>
              <span>共 <i className="not-italic text-[#aab3c0]">142 个文件</i></span>
            </div>
          </div>
        </div>

        {/* dropzone */}
        <button
          type="button"
          onClick={() => adminToast('选择文件上传…')}
          className="mb-5 block w-full cursor-pointer rounded-[11px] border-[1.5px] border-dashed border-line bg-panel-2 p-[22px] text-center transition-[.15s] hover:border-acc-dim hover:bg-acc/[0.04]"
        >
          <div className="font-mono text-[22px] text-acc">↥</div>
          <div className="mt-[6px] text-[13px] text-[#aab3c0]">拖拽文件到此处，或点击选择</div>
          <div className="mt-[3px] font-mono text-[11px] text-dim">
            支持 PNG / JPG / WebP / SVG · 单文件 ≤ 10 MB · 自动转 WebP 并生成多尺寸
          </div>
        </button>

        {/* filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map(({ f, label }) => {
            const on = active === f;
            return (
              <span
                key={f}
                role="button"
                tabIndex={0}
                onClick={() => setActive(f)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActive(f);
                  }
                }}
                className={
                  'cursor-pointer rounded-[7px] border px-3 py-[5px] font-mono text-[12px] transition-[.15s] ' +
                  (on
                    ? 'border-acc-dim bg-acc/10 text-acc'
                    : 'border-line bg-panel text-dim hover:border-[#46505e] hover:text-fg')
                }
              >
                {label}
              </span>
            );
          })}
        </div>

        {/* grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(184px,1fr))] gap-[14px]">
          {visible.map((m) => (
            <div
              key={m.fn}
              className="group cursor-pointer overflow-hidden rounded-[10px] border border-line bg-panel transition-[.15s] hover:-translate-y-[2px] hover:border-acc-dim"
            >
              <div
                className="relative grid h-[118px] place-items-center border-b border-line"
                style={{ background: `linear-gradient(135deg,${m.c1},${m.c2})` }}
              >
                <span className="absolute left-2 top-2 rounded-[5px] bg-black/35 px-[7px] py-[2px] font-mono text-[11px] text-white/85 backdrop-blur-[4px]">
                  {m.ty}
                </span>
                <span className="font-mono text-[13px] tracking-[0.04em] text-white/[0.92]">{m.ext}</span>
              </div>
              <div className="px-[11px] py-[9px]">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11.5px] text-[#aab3c0]">
                  {m.fn}
                </div>
                <div className="mt-1 flex justify-between font-mono text-[10.5px] text-dim">
                  <span>{m.dim}</span>
                  <span>{m.sz}</span>
                </div>
              </div>
              <div className="flex gap-[6px] px-[11px] pb-[11px]">
                <button
                  type="button"
                  onClick={() => adminToast(`已复制 URL：cdn.tzcode.top/${m.fn}`)}
                  className="flex-1 cursor-pointer rounded-[5px] border border-line bg-transparent p-1 font-mono text-[10.5px] text-dim transition-[.15s] hover:border-acc-dim hover:text-acc"
                >
                  复制 URL
                </button>
                <button
                  type="button"
                  onClick={() => adminToast(`已删除 ${m.fn}`)}
                  className="flex-1 cursor-pointer rounded-[5px] border border-line bg-transparent p-1 font-mono text-[10.5px] text-dim transition-[.15s] hover:border-[rgba(224,106,90,0.4)] hover:text-[#e06a5a]"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
