import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

type LoadingSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<LoadingSize, string> = {
  sm: 'size-4',
  md: 'size-8',
  lg: 'size-12',
};

interface LoadingProps {
  /** spinner 尺寸 */
  size?: LoadingSize;
  /** 是否铺满容器高度并居中 */
  fullscreen?: boolean;
  /** 附带文字提示 */
  label?: string;
  className?: string;
}

/**
 * 通用加载态组件。
 * 默认居中铺满最小高度，适合页面/区域加载占位。
 */
export function Loading({
  size = 'md',
  fullscreen = false,
  label,
  className,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullscreen ? 'min-h-screen' : 'min-h-[200px]',
        className,
      )}
    >
      <Loader2
        className={cn('text-muted-foreground animate-spin', sizeMap[size])}
      />
      {label ? <p className="text-muted-foreground text-sm">{label}</p> : null}
      <span className="sr-only">加载中…</span>
    </div>
  );
}
