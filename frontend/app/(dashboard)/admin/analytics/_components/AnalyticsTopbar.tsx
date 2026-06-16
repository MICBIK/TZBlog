'use client';

import { adminToast } from '../../_components/adminToast';
import { ripple } from '../../_components/ripple';

/**
 * 数据分析顶栏 —— 1:1 还原原型 admin-analytics.html 的 .top：
 * 面包屑 admin ❯ analytics + 导出报表 / 刷新 两个按钮（带磷光绿点击涟漪 + toast）。
 */
export function AnalyticsTopbar() {
  return (
    <header className="sticky top-0 z-[5] flex items-center justify-between border-b border-line bg-[rgba(13,18,25,0.7)] px-[26px] py-[14px] backdrop-blur-[8px]">
      <div className="font-mono text-[12px] text-dim">
        admin ❯ <b className="font-normal text-[#aab3c0]">analytics</b>
      </div>
      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          onClick={(e) => {
            ripple(e);
            adminToast('报表已导出 analytics-2026-05.csv');
          }}
          className="relative inline-flex items-center gap-[6px] overflow-hidden rounded-[7px] border border-line bg-panel px-[13px] py-[7px] font-mono text-[12.5px] text-[#aab3c0] transition-[.15s] hover:border-[#46505e] hover:text-fg"
        >
          ↧ 导出报表
        </button>
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
      </div>
    </header>
  );
}
