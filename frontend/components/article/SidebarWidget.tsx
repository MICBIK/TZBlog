import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SidebarWidgetProps {
  /** widget 标题栏命令（如 "$ stat ./site"）*/
  command: string;
  children: ReactNode;
  className?: string;
}

/**
 * 侧边栏 Widget 容器（1:1 还原设计稿 .widget，第 134-139 行）。
 * widget-h 标题栏（命令行风格）+ widget-b 内容区。
 */
export function SidebarWidget({
  command,
  children,
  className,
}: SidebarWidgetProps) {
  return (
    <div
      className={cn(
        'border-line bg-panel overflow-hidden rounded-[8px] border',
        className,
      )}
    >
      {/* widget-h — 命令行标题 */}
      <div className="border-line bg-panel2 text-muted border-b px-[15px] py-[11px] font-mono text-[12.5px]">
        <span className="text-acc">$</span> {command}
      </div>
      {/* widget-b — 内容 */}
      <div className="p-[15px]">{children}</div>
    </div>
  );
}

/** stat-row — 统计行（键值对）*/
function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-[5px] font-mono text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="text-acc font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/** 评论项 */
function CommentItem({
  who,
  text,
  on,
}: {
  who: string;
  text: string;
  on: string;
}) {
  return (
    <div className="border-line text-fg border-b border-dashed py-[9px] font-sans text-[13px] last:border-0">
      <span className="text-acc font-mono text-[12px]">{who}</span>：{text}
      <div className="text-dim mt-[3px] text-[11.5px]">on {on}</div>
    </div>
  );
}

/** 友链项 */
function FriendLink({
  name,
  tag,
  href = '#',
}: {
  name: string;
  tag: string;
  href?: string;
}) {
  return (
    <a
      href={href}
      className="text-fg hover:text-acc flex items-center gap-2 py-[7px] text-[13px] transition-[.15s]"
    >
      <span className="text-acc-dim">→</span>
      {name}
      <span className="text-dim ml-auto font-sans text-[11.5px]">{tag}</span>
    </a>
  );
}

/** 标签云项 */
function TagCloudItem({
  name,
  count,
  href = '#',
}: {
  name: string;
  count?: number;
  href?: string;
}) {
  return (
    <a
      href={href}
      className="border-line2 text-muted hover:border-acc-dim hover:text-acc rounded-[5px] border px-[9px] py-1 text-[12px] transition-[.15s]"
    >
      {name}
      {count !== undefined && <span className="text-dim ml-1">{count}</span>}
    </a>
  );
}

SidebarWidget.StatRow = StatRow;
SidebarWidget.CommentItem = CommentItem;
SidebarWidget.FriendLink = FriendLink;
SidebarWidget.TagCloudItem = TagCloudItem;
