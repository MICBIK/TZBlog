'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { hydrateAuth, useAuthStore } from '@/lib/store/authStore';

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
      <div className="w-full max-w-md">
        {/* 返回首页 */}
        <Link
          href="/"
          className="text-muted hover:text-primary mb-4 inline-block font-mono text-xs transition-colors"
        >
          ← 返回 tzblog
        </Link>

        {/* 终端窗口外壳 */}
        <div className="border-border from-card overflow-hidden rounded-[10px] border bg-gradient-to-b to-[#0d1219] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]">
          {/* 终端标题栏 */}
          <div className="border-border bg-secondary flex items-center gap-2 border-b px-4 py-[11px]">
            <span className="size-[11px] rounded-full bg-[#ff5f57]" />
            <span className="size-[11px] rounded-full bg-[#febc2e]" />
            <span className="size-[11px] rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-[12.5px] text-[var(--dim)]">
              auth — haiden@tzblog
            </span>
          </div>

          {/* 终端正文 */}
          <div className="p-6">
            <p className="text-muted mb-5 font-mono text-[13px]">
              <span className="text-primary">$</span>{' '}
              <span>ssh haiden@tzblog --login</span>
              <span className="cursor-blink" />
            </p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
