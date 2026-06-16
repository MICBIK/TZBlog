'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * 首页客户端交互（1:1 还原 front-home.html 内联 <script>，第 391-416 行）。
 * 三段原型行为合并为一个 client island，markup 保持服务端渲染（仅靠 data 属性驱动）：
 *  1. [data-copy] 代码块一键复制 → navigator.clipboard，按钮文案变 copied ✓
 *  2. [data-msg] 未接线动作轻提示（登录方式 / 稍后读 / 外链）→ 走项目 canonical sonner toast
 *  3. .rv 滚动入场 → IntersectionObserver 加 .in，按出现顺序错峰 40ms（i%5）
 * prefers-reduced-motion 下 .rv 由 globals.css 直接静切，无需 JS 守卫。
 */
export function HomeClientBehaviors() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // 1. 代码块复制
    document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
      const handler = () => {
        const block = btn.closest('.codeblock');
        const codeEl = block?.querySelector<HTMLElement>('[data-code]');
        if (!codeEl) return;
        navigator.clipboard.writeText(codeEl.innerText).then(() => {
          btn.textContent = 'copied ✓';
          btn.classList.add('ok');
          setTimeout(() => {
            btn.textContent = 'copy';
            btn.classList.remove('ok');
          }, 1600);
        });
      };
      btn.addEventListener('click', handler);
      cleanups.push(() => btn.removeEventListener('click', handler));
    });

    // 2. 未接线动作 toast
    document.querySelectorAll<HTMLElement>('[data-msg]').forEach((el) => {
      const handler = (e: Event) => {
        e.preventDefault();
        const msg = el.dataset.msg;
        if (msg) toast(msg);
      };
      el.addEventListener('click', handler);
      cleanups.push(() => el.removeEventListener('click', handler));
    });

    // 3. 滚动入场
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll<HTMLElement>('.rv').forEach((el, i) => {
      el.style.transitionDelay = `${(i % 5) * 40}ms`;
      io.observe(el);
    });
    cleanups.push(() => io.disconnect());

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
