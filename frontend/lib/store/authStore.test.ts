import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TOKEN_STORAGE_KEY } from '@/lib/constants';
import type { AuthUser } from '@/types/auth';

import { hydrateAuth, useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // 重置 store 到初始状态
    useAuthStore.setState({ user: null, hydrated: false });
  });

  describe('useAuthStore', () => {
    it('should initialize with null user and hydrated=false', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.hydrated).toBe(false);
    });

    it('should set auth and store token', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser: AuthUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      act(() => {
        result.current.setAuth(mockUser, 'test-token');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.hydrated).toBe(true);
      expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('test-token');
    });

    it('should update user partially', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser: AuthUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      act(() => {
        result.current.setAuth(mockUser, 'test-token');
      });

      act(() => {
        result.current.updateUser({ email: 'newemail@example.com' });
      });

      expect(result.current.user).toEqual({
        ...mockUser,
        email: 'newemail@example.com',
      });
    });

    it('should not update when user is null', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateUser({ email: 'test@example.com' });
      });

      expect(result.current.user).toBeNull();
    });

    it('should logout and clear token', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser: AuthUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      act(() => {
        result.current.setAuth(mockUser, 'test-token');
      });

      expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('test-token');

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    });
  });

  describe('hydrateAuth', () => {
    it('should set hydrated=true when no token exists', async () => {
      await hydrateAuth();

      const state = useAuthStore.getState();
      expect(state.hydrated).toBe(true);
      expect(state.user).toBeNull();
    });

    it('should fetch user when valid token exists', async () => {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, 'valid-token');

      const mockUser: AuthUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      // Mock getCurrentUser
      vi.doMock('@/lib/api/auth', () => ({
        getCurrentUser: vi.fn().mockResolvedValue(mockUser),
      }));

      await hydrateAuth();

      const state = useAuthStore.getState();
      expect(state.hydrated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });

    it('should clear invalid token on fetch error', async () => {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, 'invalid-token');

      // Mock getCurrentUser to throw error
      vi.doMock('@/lib/api/auth', () => ({
        getCurrentUser: vi.fn().mockRejectedValue(new Error('Unauthorized')),
      }));

      await hydrateAuth();

      const state = useAuthStore.getState();
      expect(state.hydrated).toBe(true);
      expect(state.user).toBeNull();
      expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    });

    it('should not run on server side', async () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing server-side behavior
      delete global.window;

      await hydrateAuth();

      const state = useAuthStore.getState();
      // State should remain unchanged
      expect(state.hydrated).toBe(false);

      global.window = originalWindow;
    });
  });
});
