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
 *
 * 说明：本项目的认证基于 localStorage 中的 JWT（无服务端 session/cookie），
 * 因此 Next.js middleware 无法读取登录态，后台守卫只能在客户端进行。
 * 真正的鉴权防线在后端 Bearer 校验上；此组件负责前端体验与第一道拦截。
 *
 * 防闪烁设计：在 hydration 完成前或鉴权未通过时，始终只渲染 Loading，
 * 子组件只有在“已登录且为管理员”时才会挂载，从而避免后台内容在 hydration
 * 与跳转之间的窗口里短暂外泄。
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { hydrated, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  const allowed = hydrated && isAuthenticated && isAdmin;

  useEffect(() => {
    // 鉴权未通过时才触发跳转；跳转目标页面卸载本页前，下方 render gate
    // 保证只渲染 Loading，子组件不会挂载。
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/');
    }
  }, [hydrated, isAuthenticated, isAdmin, router]);

  if (!allowed) {
    return <Loading fullscreen label="验证身份中…" />;
  }

  return <>{children}</>;
}
