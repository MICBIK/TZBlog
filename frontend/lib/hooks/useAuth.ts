'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { logout as logoutApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';

/**
 * 认证 hook — 封装 authStore 的派生状态与常用操作。
 *
 * - isAuthenticated：是否已登录
 * - isAdmin：是否管理员（用于后台守卫）
 * - handleLogout：登出（清 API + store + 跳转登录页）
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logoutStore = useAuthStore((s) => s.logout);
  const router = useRouter();

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const handleLogout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // 后端登出失败（如 token 过期）也清除本地态
    }
    logoutStore();
    router.push('/login');
  }, [logoutStore, router]);

  return {
    user,
    hydrated,
    isAuthenticated,
    isAdmin,
    handleLogout,
  };
}
