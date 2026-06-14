'use client';

/** 预设余烬粒子位置（避免 render 阶段调用 Math.random） */
const EMBERS = [
  { left: 8, delay: 0, duration: 14 },
  { left: 23, delay: 3, duration: 11 },
  { left: 41, delay: 7, duration: 16 },
  { left: 57, delay: 1, duration: 13 },
  { left: 69, delay: 9, duration: 10 },
  { left: 82, delay: 5, duration: 15 },
  { left: 15, delay: 11, duration: 12 },
  { left: 34, delay: 6, duration: 18 },
  { left: 48, delay: 2, duration: 9 },
  { left: 63, delay: 8, duration: 14 },
  { left: 76, delay: 4, duration: 11 },
  { left: 91, delay: 10, duration: 13 },
];

/**
 * 站点动效背景层（还原设计稿 #site-fx）。
 * - 极光：两个缓慢漂移的模糊光斑
 * - 余烬：缓慢下落的磷光粒子
 */
export function BackgroundFX() {
  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora a1" />
        <div className="aurora a2" />
      </div>
      {EMBERS.map((ember, i) => (
        <span
          key={i}
          className="ember"
          style={{
            left: `${ember.left}%`,
            animationDelay: `${ember.delay}s`,
            animationDuration: `${ember.duration}s`,
          }}
        />
      ))}
    </>
  );
}
