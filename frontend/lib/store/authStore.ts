'use client';

import { create } from 'zustand';

import { TOKEN_STORAGE_KEY } from '@/lib/constants';
import type { AuthUser } from '@/types/auth';

// re-export，保持向后兼容（其他文件可能从 authStore 导入 AuthUser）
export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  /** 是否已完成首次 hydration（区分"未登录"与"尚未读取 localStorage"） */
  hydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
}

/**
 * 认证状态管理。
 * Token 单独写入 localStorage（供 axios 拦截器读取，见 lib/api/client.ts）。
 * 用户信息保存在内存 store 中，避免敏感字段长期驻留 localStorage。
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    set({ user, hydrated: true });
  },

  updateUser: (patch) =>
    set((state) =>
      state.user ? { user: { ...state.user, ...patch } } : state,
    ),

  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    set({ user: null });
  },
}));

/**
 * 在客户端首次渲染时调用，从 localStorage 恢复登录态。
 * 如果 token 存在且有效，则调用 /auth/me 获取用户信息。
 */
export async function hydrateAuth(): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    useAuthStore.setState({ hydrated: true });
    return;
  }

  try {
    // 动态导入避免循环依赖
    const { getCurrentUser } = await import('@/lib/api/auth');
    const user = await getCurrentUser();
    useAuthStore.setState({ user, hydrated: true });
  } catch {
    // Token 无效或过期，清除
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    useAuthStore.setState({ user: null, hydrated: true });
  }
}
