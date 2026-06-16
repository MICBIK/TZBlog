'use client';

import { useRef } from 'react';

import { adminToast } from './adminToast';

interface PendingComment {
  author: string;
  article: string;
  content: string;
}

const pendingComments: PendingComment[] = [
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

/**
 * 待审评论队列 —— 还原原型 $ comments --pending。
 * 通过/删除均触发 moderate：卡片高度+透明度收起后移除，并弹 toast。
 * 1:1 复刻原型 moderate(btn,m) 的 DOM 折叠行为。
 */
export function PendingComments() {
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  const moderate = (idx: number, message: string) => {
    const c = refs.current[idx];
    if (c) {
      c.style.transition = '.3s';
      c.style.opacity = '0';
      c.style.height = `${c.offsetHeight}px`;
      setTimeout(() => {
        c.style.height = '0';
        c.style.padding = '0';
        c.style.overflow = 'hidden';
      }, 10);
    }
    adminToast(message);
  };

  return (
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
          ref={(node) => {
            refs.current[idx] = node;
          }}
          className="border-b border-[#0d1219] px-4 py-[13px] last:border-b-0"
        >
          <div className="mb-[5px] flex items-center gap-2">
            <b className="text-[12.5px]">{comment.author}</b>
            <span className="font-mono text-[11px] text-dim">
              on《{comment.article}》
            </span>
          </div>
          <p className="mb-[7px] text-[12.5px] text-[#aab3c0]">
            {comment.content}
          </p>
          <div className="flex gap-[7px]">
            <button
              type="button"
              onClick={() => moderate(idx, '已通过')}
              className="rounded-[5px] border border-line bg-transparent px-[9px] py-1 font-mono text-[11px] text-dim transition-[.15s] hover:border-acc-dim hover:text-acc"
            >
              ✓ 通过
            </button>
            <button
              type="button"
              onClick={() => moderate(idx, '已删除')}
              className="rounded-[5px] border border-line bg-transparent px-[9px] py-1 font-mono text-[11px] text-dim transition-[.15s] hover:border-[rgba(224,106,90,0.4)] hover:text-[#e06a5a]"
            >
              ✕ 删除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
