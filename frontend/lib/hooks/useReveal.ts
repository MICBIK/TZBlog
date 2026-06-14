'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reveal 动画 hook（还原设计稿 .rv → .rv.in）。
 * 元素进入视口时返回 true，触发渐入动画。
 * 尊重 prefers-reduced-motion（直接返回 true）。
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit,
) {
  const ref = useRef<T>(null);
  // 初始化时检查 reduced-motion，避免 effect 内 setState
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    // reduced-motion 已在初始化时设为 true
    if (visible) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px', ...options },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, options]);

  return { ref, visible };
}
