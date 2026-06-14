import type { ReactNode } from 'react';

import { Inbox } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmptyProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * 空状态占位组件。
 * 用于列表无数据、无搜索结果等场景。
 */
export function Empty({
  icon,
  title = '暂无数据',
  description,
  children,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        'flex min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center',
        className,
      )}
    >
      {icon ?? <Inbox className="size-10 text-muted-foreground" />}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
