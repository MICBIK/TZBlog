'use client';

import { useState, useEffect, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { Toaster } from '@/components/ui/sonner';
import { hydrateAuth } from '@/lib/store/authStore';

/**
 * 全局客户端 Provider 聚合：
 * - TanStack Query（数据获取/缓存）
 * - Sonner Toaster（全局通知）
 * - Auth Hydration（登录态恢复）
 * 使用 useState 创建 QueryClient，保证每个 SSR 请求一份独立实例。
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 避免客户端立即重新请求窗口聚焦时的重复请求（按需调整）
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  // 恢复登录态（从 localStorage 的 token 调用 /auth/me）
  useEffect(() => {
    hydrateAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-center" />
      {process.env.NODE_ENV === 'development' ? <ReactQueryDevtools /> : null}
    </QueryClientProvider>
  );
}
