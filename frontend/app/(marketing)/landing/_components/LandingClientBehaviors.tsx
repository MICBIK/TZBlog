'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * landing 客户端交互（1:1 还原 landing.html 内联 <script>，第 215-220 行）。
 *  1. [data-ripple] 按钮点击磷光绿涟漪 → 动态 span + ripple keyframe（globals.css）
 *  2. [data-subscribe] 订阅表单 → e.preventDefault + reset + canonical sonner toast
 * markup 保持服务端渲染，仅靠 data 属性驱动。
 */
export function LandingClientBehaviors() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // 1. 按钮点击涟漪
    document
      .querySelectorAll<HTMLElement>('[data-ripple]')
      .forEach((el) => {
        const handler = (e: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          const d = Math.max(el.offsetWidth, el.offsetHeight);
          const x = e.clientX - rect.left - d / 2;
          const y = e.clientY - rect.top - d / 2;
          const r = document.createElement('span');
          r.style.cssText = `position:absolute;border-radius:50%;width:${d}px;height:${d}px;left:${x}px;top:${y}px;background:radial-gradient(circle,rgba(63,224,143,.35),transparent 70%);transform:scale(0);animation:ripple .5s ease-out;pointer-events:none`;
          el.appendChild(r);
          setTimeout(() => r.remove(), 500);
        };
        el.addEventListener('click', handler);
        cleanups.push(() => el.removeEventListener('click', handler));
      });

    // 2. 订阅表单
    document
      .querySelectorAll<HTMLFormElement>('[data-subscribe]')
      .forEach((form) => {
        const handler = (e: Event) => {
          e.preventDefault();
          form.reset();
          toast('订阅成功，确认邮件已发送 ✓');
        };
        form.addEventListener('submit', handler);
        cleanups.push(() => form.removeEventListener('submit', handler));
      });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
