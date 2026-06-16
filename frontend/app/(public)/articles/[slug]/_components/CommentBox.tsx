'use client';

import { showToast } from './toast';

/**
 * 评论发布框 —— 1:1 还原原型 .cbox。
 * 发布按钮触发 toast（登录后才能发布）。
 */
export function CommentBox() {
  return (
    <div className="mb-6 flex gap-2.5">
      <textarea
        placeholder="// 写下你的想法… 登录后发布"
        className="border-[var(--line-2)] bg-panel text-fg min-h-[48px] flex-1 resize-y rounded-lg border px-3.5 py-[11px] font-sans text-sm focus:border-[var(--acc-dim)] focus:outline-none"
      />
      <button
        type="button"
        onClick={() =>
          showToast('登录后即可发布评论（GitHub / Google / 邮箱）')
        }
        className="bg-acc cursor-pointer self-end rounded-md border-none px-[18px] py-2.5 font-mono text-[13px] font-bold text-[#06120b]"
      >
        发布
      </button>
    </div>
  );
}
