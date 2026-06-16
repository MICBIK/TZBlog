'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { hydrateAuth, useAuthStore } from '@/lib/store/authStore';

/**
 * (auth) 布局 — 纯 pass-through + 登录态重定向。
 * 原型 auth.html 是单层终端窗口；外壳（返回链接 + term-bar + 随 tab 联动的 $ 提示行）
 * 完全由 AuthTerminal 自渲染（含 min-h-[100dvh] 居中）。此处不再渲染重复的终端外壳，
 * 避免与 AuthTerminal 叠成双层窗口 / 重复返回链接 / 写死 --login 不随注册 tab 变化。
 * 同时按 DELIVERY §6.3 不注入 Footer/BackgroundFX 营销底栏（登录页惯例）。
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    hydrateAuth();
  }, []);

  useEffect(() => {
    if (hydrated && user) {
      router.replace('/admin');
    }
  }, [hydrated, user, router]);

  return <>{children}</>;
}
