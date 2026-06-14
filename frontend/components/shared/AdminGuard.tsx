'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { Loading } from '@/components/shared/Loading';
import { useAuth } from '@/lib/hooks/useAuth';

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * 后台路由守卫（客户端组件）。
 * - 未 hydrate 完成时显示 Loading
 * - 未登录 → 跳转 /login
 * - 已登录但非管理员 → 跳转首页
 * - 已登录且管理员 → 渲染子组件
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { hydrated, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/');
    }
  }, [hydrated, isAuthenticated, isAdmin, router]);

  // hydration 未完成或正在跳转时，显示 Loading
  if (!hydrated || !isAuthenticated || !isAdmin) {
    return <Loading fullscreen label="验证身份中…" />;
  }

  return <>{children}</>;
}
