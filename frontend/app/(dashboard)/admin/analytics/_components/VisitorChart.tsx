/**
 * 30 天访客趋势折线图 —— 1:1 还原原型 admin-analytics.html 内联 JS 构建的 SVG。
 * 同样的网格线 / 折线 / 逐点 hover（圆点 + UV tooltip 浮现）。
 * hover 交互用 CSS group-hover 实现，无需 JS 状态。
 */
const DATA = [
  62, 71, 58, 84, 93, 77, 68, 102, 118, 96, 87, 124, 109, 141, 128, 116, 134,
  152, 147, 139, 158, 166, 151, 173, 168, 182, 176, 191, 205, 247,
];

const W = 900;
const H = 200;
const PAD = 10;

export function VisitorChart() {
  const max = Math.max(...DATA);
  const min = Math.min(...DATA);
  const n = DATA.length;
  const step = (W - PAD * 2) / (n - 1);

  const x = (i: number) => PAD + i * step;
  const y = (v: number) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);

  const points = DATA.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const gridValues = [max, Math.round((max + min) / 2), min];

  return (
    <div className="px-4 pb-[10px] pt-[18px]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-[200px] w-full overflow-visible"
      >
        {gridValues.map((v) => {
          const gy = y(v);
          return (
            <g key={v}>
              <line
                x1={0}
                y1={gy}
                x2={W}
                y2={gy}
                className="stroke-line"
                strokeWidth={1}
              />
              <text
                x={2}
                y={gy - 4}
                className="fill-[#46505e] font-mono text-[10px]"
              >
                {v}
              </text>
            </g>
          );
        })}

        <polyline
          points={points}
          className="fill-none stroke-acc"
          strokeWidth={2}
        />

        {DATA.map((v, i) => {
          const px = x(i);
          const py = y(v);
          return (
            <g key={i} className="group">
              <rect
                x={px - step / 2}
                y={0}
                width={step}
                height={H}
                className="fill-transparent [cursor:crosshair]"
              />
              <circle
                cx={px}
                cy={py}
                r={4}
                className="fill-[#0a0e14] stroke-acc opacity-0 transition-[.15s] group-hover:opacity-100"
                strokeWidth={2}
              />
              <g
                transform={`translate(${px},${py - 14})`}
                className="opacity-0 transition-[.12s] group-hover:opacity-100"
              >
                <rect
                  x={-30}
                  y={-22}
                  width={60}
                  height={20}
                  rx={4}
                  className="fill-[#0d1219] stroke-line"
                />
                <text
                  y={-8}
                  textAnchor="middle"
                  className="fill-[#e4e8ee] font-mono text-[11px]"
                >
                  {v} UV
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
