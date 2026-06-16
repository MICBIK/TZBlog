'use client';

import { useState } from 'react';

import { adminToast } from '../../_components/adminToast';
import { ripple } from '../../_components/ripple';

const RANGES = ['7天', '30天', '90天'] as const;

/**
 * 图表区间切换 —— 1:1 还原原型 .rng：点选高亮 + toast「已切换到 X 区间」+ 磷光绿涟漪。
 * 默认选中 30天（同原型 .on）。
 */
export function RangeToggle() {
  const [active, setActive] = useState('30天');

  return (
    <div className="flex gap-[6px]">
      {RANGES.map((r) => {
        const on = r === active;
        return (
          <button
            key={r}
            type="button"
            onClick={(e) => {
              ripple(e);
              setActive(r);
              adminToast(`已切换到 ${r} 区间`);
            }}
            className={`relative overflow-hidden rounded-[5px] border px-[9px] py-[3px] font-mono text-[11px] transition-[.15s] ${
              on
                ? 'border-acc-dim bg-acc/8 text-acc'
                : 'border-line bg-transparent text-dim hover:border-acc-dim hover:bg-acc/8 hover:text-acc'
            }`}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}
