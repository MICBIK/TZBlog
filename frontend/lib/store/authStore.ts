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
 * 在客户端首次渲染时调用，从 localStorage 标记 hydration 完成。
 * Token 本身由 axios 拦截器直接读取，此处仅刷新 hydrated 标记。
 */
export function hydrateAuth(): void {
  if (typeof window === 'undefined') return;
  useAuthStore.setState({ hydrated: true });
}
