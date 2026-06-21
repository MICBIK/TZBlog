import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminGuard } from './AdminGuard';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/lib/hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

describe('AdminGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading before hydration completes', () => {
    mockUseAuth.mockReturnValue({
      hydrated: false,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      handleLogout: vi.fn(),
    });

    render(
      <AdminGuard>
        <div>secret</div>
      </AdminGuard>,
    );

    expect(screen.getByText('验证身份中…')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('redirects anonymous users to login', async () => {
    mockUseAuth.mockReturnValue({
      hydrated: true,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      handleLogout: vi.fn(),
    });

    render(
      <AdminGuard>
        <div>secret</div>
      </AdminGuard>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('renders children for authenticated admins', () => {
    mockUseAuth.mockReturnValue({
      hydrated: true,
      isAuthenticated: true,
      isAdmin: true,
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
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      handleLogout: vi.fn(),
    });

    render(
      <AdminGuard>
        <div>secret</div>
      </AdminGuard>,
    );

    expect(screen.getByText('secret')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
