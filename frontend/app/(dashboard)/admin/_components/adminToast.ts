/**
 * 后台终端 toast —— 1:1 还原原型 admin-dashboard.html 内联 JS 的 toast(m)。
 * 单一复用元素，居中底部弹出，磷光绿描边，1.8s 后自动隐藏。
 * 文案以 textContent 注入，无 XSS。prefers-reduced-motion 下跳过滑入位移。
 */
let el: HTMLDivElement | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

export function adminToast(message: string): void {
  if (typeof document === 'undefined') return;

  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  if (!el) {
    el = document.createElement('div');
    el.style.cssText =
      'position:fixed;bottom:22px;left:50%;' +
      'transform:translateX(-50%) translateY(20px);' +
      'background:var(--panel,#11171f);border:1px solid var(--acc-dim,#1f7a4d);' +
      'color:var(--acc,#3fe08f);' +
      'font-family:var(--font-mono),"JetBrains Mono",ui-monospace,monospace;' +
      'font-size:12.5px;padding:9px 16px;border-radius:8px;' +
      'opacity:0;pointer-events:none;z-index:20';
    document.body.appendChild(el);
  }

  el.textContent = message;
  el.style.transition = reduce ? 'none' : '.25s';

  // 下一帧切到显示态，触发 transition
  requestAnimationFrame(() => {
    if (!el) return;
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  });

  clearTimeout(timer);
  timer = setTimeout(() => {
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(20px)';
  }, 1800);
}
