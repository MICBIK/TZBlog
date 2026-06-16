'use client';

import { useEffect, useState } from 'react';

/**
 * 顶部阅读进度条 —— 1:1 还原原型 .progress（含磷光绿辉光）。
 * 滚动时按 scrollTop / (scrollHeight - clientHeight) 计算百分比。
 */
export function ArticleProgress() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      setWidth(pct);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="bg-acc fixed left-0 top-0 z-30 h-0.5"
      style={{ width: `${width}%`, boxShadow: '0 0 8px var(--acc)' }}
    />
  );
}
