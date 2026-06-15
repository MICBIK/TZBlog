import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface TerminalWindowProps {
  /** 终端标题栏文字（如 "~/posts/xxx.md — pinned"） */
  title?: string;
  /** 终端正文 */
  children: ReactNode;
  className?: string;
}

/**
 * 终端窗口（1:1 还原设计稿 .term，第 74-86 行）。
 * term-bar 红黄绿圆点 + term-body 内容区。
 * 渐变背景 + 大阴影营造终端浮起感。
 */
export function TerminalWindow({
  title,
  children,
  className,
}: TerminalWindowProps) {
  return (
    <div
      className={cn(
        'border-line overflow-hidden rounded-[10px] border',
        'from-panel to-bg2 bg-gradient-to-b',
        'shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]',
        className,
      )}
    >
      {/* term-bar — 红黄绿圆点 */}
      <div className="border-line bg-panel2 flex items-center gap-2 border-b px-4 py-[11px]">
        <span className="size-[11px] rounded-full bg-[#ff5f57]" />
        <span className="size-[11px] rounded-full bg-[#febc2e]" />
        <span className="size-[11px] rounded-full bg-[#28c840]" />
        {title && (
          <span className="text-dim ml-2 font-mono text-[12.5px]">{title}</span>
        )}
      </div>
      {/* term-body */}
      <div className="px-[30px] pb-[30px] pt-[26px]">{children}</div>
    </div>
  );
}
