import type { ReactNode } from 'react';

/**
 * 认证页面组布局。
 * 居中、简洁，不带公共导航。
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
