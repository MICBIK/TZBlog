'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/lib/store/authStore';
import { hydrateAuth } from '@/lib/store/authStore';

/**
 * 认证页面组布局。
 * 居中、简洁，不带公共导航。
 * 已登录用户访问 /login、/register 时自动跳转 /admin。
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

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
