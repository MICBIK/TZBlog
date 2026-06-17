'use client';

import { useEffect, useState } from 'react';

import { showToast } from './toast';

interface TocItem {
  id: string;
  text: string;
}

interface ArticleSidebarProps {
  items: TocItem[];
  likeCount: number;
  favoriteCount?: number;
}

/**
 * 文章右侧栏 —— 1:1 还原原型 <aside>：TOC scroll-spy + 赞/收藏/分享。
 * scroll-spy 用 IntersectionObserver（rootMargin -72px / -65%）高亮当前章节。
 */
export function ArticleSidebar({
  items,
  likeCount,
  favoriteCount = Math.max(0, Math.round(likeCount * 0.6)),
}: ArticleSidebarProps) {
  const [active, setActive] = useState('');

  useEffect(() => {
    const heads = items.map((t) => document.getElementById(t.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (heads.length === 0) {
      return;
    }
    const spy = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        }),
      { rootMargin: '-72px 0px -65% 0px' },
    );
    heads.forEach((h) => spy.observe(h));
    return () => spy.disconnect();
  }, [items]);

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href);
    }
    showToast('链接已复制到剪贴板');
  }

  return (
    <aside className="static order-first max-md:static md:sticky md:top-[78px] md:order-none">
      <nav className="border-line bg-panel overflow-hidden rounded-lg border">
        <div className="border-line bg-panel2 text-muted-foreground border-b px-[15px] py-[11px] font-mono text-[12.5px]">
          <span className="text-acc">$</span> grep &apos;^##&apos; article
        </div>
        <div className="px-1.5 py-2">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`block border-l-2 px-3 py-1.5 font-sans text-[13px] leading-[1.4] transition-colors duration-150 ${
                active === item.id
                  ? 'border-acc text-acc'
                  : 'text-muted-foreground hover:text-fg border-transparent'
              }`}
            >
              {item.text}
            </a>
          ))}
        </div>
      </nav>

      <div className="mt-4 flex flex-col gap-2">
        <SideButton onClick={() => showToast('已点赞 · 感谢支持')}>
          👍 赞{' '}
          <span className="text-dim float-right font-sans">{likeCount}</span>
        </SideButton>
        <SideButton
          onClick={() => showToast('已加入收藏 · 可在「我的书架」查看')}
        >
          ★ 收藏{' '}
          <span className="text-dim float-right font-sans">
            {favoriteCount}
          </span>
        </SideButton>
        <SideButton onClick={handleShare}>↗ 分享</SideButton>
      </div>
    </aside>
  );
}

function SideButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-[var(--line-2)] text-fg hover:text-acc cursor-pointer rounded-md border bg-transparent px-3.5 py-[9px] text-left font-mono text-[13px] transition-colors duration-150 hover:border-[var(--acc-dim)]"
    >
      {children}
    </button>
  );
}
