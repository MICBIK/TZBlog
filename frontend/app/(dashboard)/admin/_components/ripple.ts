/**
 * 按钮磷光绿涟漪 —— 1:1 还原原型 admin-dashboard.html 内联 JS 的 .btn ripple。
 * 用 Web Animations API 取代原型的注入式 @keyframes，避免污染全局样式。
 * prefers-reduced-motion 下整体跳过。宿主元素需 position:relative + overflow:hidden。
 */
import type { MouseEvent } from 'react';

export function ripple(e: MouseEvent<HTMLElement>): void {
  const el = e.currentTarget;
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  const rect = el.getBoundingClientRect();
  const d = Math.max(el.offsetWidth, el.offsetHeight);
  const x = e.clientX - rect.left - d / 2;
  const y = e.clientY - rect.top - d / 2;

  const r = document.createElement('span');
  r.style.cssText =
    `position:absolute;border-radius:50%;width:${d}px;height:${d}px;` +
    `left:${x}px;top:${y}px;pointer-events:none;` +
    'background:radial-gradient(circle,rgba(63,224,143,.4),transparent 70%)';
  el.appendChild(r);

  const anim = r.animate(
    [
      { transform: 'scale(0)', opacity: 1 },
      { transform: 'scale(2.2)', opacity: 0 },
    ],
    { duration: 500, easing: 'ease-out' }
  );
  anim.onfinish = () => r.remove();
}
