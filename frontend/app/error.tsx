'use client';

import { useEffect } from 'react';

import { AlertTriangle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * 根级路由错误边界。
 * Next.js 在子树抛出未捕获错误时渲染此组件。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[RouteError]', error);
    }
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="size-12 text-destructive" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">页面出错了</h1>
        <p className="text-sm text-muted-foreground">
          抱歉，渲染此页面时发生错误。可以尝试重新加载。
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        <RotateCcw className="size-4" />
        重试
      </Button>
    </main>
  );
}
