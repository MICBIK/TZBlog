import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authApi from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';

import { useAuth } from './useAuth';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/lib/api/auth', () => ({
  logout: vi.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    useAuthStore.setState({ user: null, hydrated: false });
  });

  it('derives auth flags from store state', () => {
    useAuthStore.setState({
      hydrated: true,
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        displayName: 'Admin',
        bio: '',
        avatarUrl: '',
        role: 'admin',
        status: 'active',
        isVerified: true,
        lastLoginAt: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.hydrated).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.user?.username).toBe('admin');
  });

  it('logs out via api, clears store and redirects', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    useAuthStore.setState({
      hydrated: true,
      user: {
        id: 1,
        username: 'user',
        email: 'user@example.com',
        displayName: 'User',
        bio: '',
        avatarUrl: '',
        role: 'user',
        status: 'active',
        isVerified: true,
        lastLoginAt: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    });
    window.localStorage.setItem('tzblog_token', 'token');

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
    expect(window.localStorage.getItem('tzblog_token')).toBeNull();
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('still clears local state when logout api fails', async () => {
    vi.mocked(authApi.logout).mockRejectedValue(new Error('expired'));
    useAuthStore.setState({
      hydrated: true,
      user: {
        id: 1,
        username: 'user',
        email: 'user@example.com',
        displayName: 'User',
        bio: '',
        avatarUrl: '',
        role: 'user',
        status: 'active',
        isVerified: true,
        lastLoginAt: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(useAuthStore.getState().user).toBeNull();
    expect(pushMock).toHaveBeenCalledWith('/login');
  });
});
