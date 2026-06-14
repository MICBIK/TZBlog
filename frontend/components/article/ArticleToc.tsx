'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  text: string;
}

interface ArticleTocProps {
  items: TocItem[];
}

/**
 * 文章目录导航（1:1 还原设计稿 .toc，第 88-100 行）。
 * sticky 定位、scrollspy 高亮当前章节。
 */
export function ArticleToc({ items }: ArticleTocProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-72px 0px -70% 0px' },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="border-line bg-panel overflow-hidden rounded-[8px] border">
      {/* toc-h */}
      <div className="border-line bg-panel2 text-muted border-b px-[15px] py-[11px] font-mono text-[12.5px]">
        <span className="text-acc">$</span> cat toc.md
      </div>
      {/* toc-b */}
      <div className="px-1.5 py-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              'block border-l-2 px-3 py-1.5 font-sans text-[13px] leading-[1.4] transition-[.15s]',
              activeId === item.id
                ? 'border-acc text-acc'
                : 'text-muted hover:text-fg border-transparent',
            )}
          >
            {item.text}
          </a>
        ))}
      </div>
    </div>
  );
}
