/**
 * 横向条形排行 —— 1:1 还原原型 admin-analytics.html 内联 JS 的 bars()。
 * 宽度按当前数据集最大值归一；可选命令行提示符 q（热门搜索词的 ❯）。
 * 用于：流量来源 / 热门搜索词 / 分类分布。
 */
export interface BarRow {
  name: string;
  v: number;
  q?: string;
  value: string;
}

export function BarRows({ rows }: { rows: BarRow[] }) {
  const mx = Math.max(...rows.map((r) => r.v));

  return (
    <div className="px-4 pb-[14px] pt-2">
      {rows.map((r) => (
        <div
          key={r.name}
          className="border-b border-[#0d1219] py-[10px] last:border-b-0"
        >
          <div className="mb-[6px] flex items-baseline justify-between">
            <span className="text-[13px] text-[#aab3c0]">
              {r.q && <span className="mr-[6px] font-mono text-acc">{r.q}</span>}
              {r.name}
            </span>
            <span className="font-mono text-[12px] tabular-nums text-dim">
              {r.value}
            </span>
          </div>
          <div className="h-[6px] overflow-hidden rounded-[4px] bg-[#0d1219]">
            <div
              className="h-full rounded-[4px] bg-gradient-to-r from-acc-dim to-acc shadow-[0_0_8px_rgba(63,224,143,0.3)]"
              style={{ width: `${((r.v / mx) * 100).toFixed(1)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
