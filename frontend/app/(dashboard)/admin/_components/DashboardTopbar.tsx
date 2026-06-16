'use client';

import Link from 'next/link';

import { adminToast } from './adminToast';
import { ripple } from './ripple';

/**
 * 仪表盘顶栏 —— 还原原型 .top：面包屑 + 刷新(toast '已同步最新数据') + 写文章。
 * 两个按钮均带磷光绿点击涟漪。
 */
export function DashboardTopbar() {
  return (
    <header className="sticky top-0 z-[5] flex items-center justify-between border-b border-line bg-[rgba(13,18,25,0.7)] px-[26px] py-[14px] backdrop-blur-[8px]">
      <div className="font-mono text-[12px] text-dim">
        admin ❯ <b className="font-normal text-[#aab3c0]">dashboard</b>
      </div>
      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          onClick={(e) => {
            ripple(e);
            adminToast('已同步最新数据');
          }}
          className="relative inline-flex items-center gap-[6px] overflow-hidden rounded-[7px] border border-line bg-panel px-[13px] py-[7px] font-mono text-[12.5px] text-[#aab3c0] transition-[.15s] hover:border-[#46505e] hover:text-fg"
        >
          ↻ 刷新
        </button>
        <Link
          href="/admin/articles/new"
          onClick={ripple}
          className="relative inline-flex items-center gap-[6px] overflow-hidden rounded-[7px] border border-acc-dim bg-acc/12 px-[13px] py-[7px] font-mono text-[12.5px] text-acc transition-[.15s] hover:bg-acc/18"
        >
          ＋ 写文章
        </Link>
      </div>
    </header>
  );
}
