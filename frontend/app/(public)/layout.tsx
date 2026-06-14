import type { ReactNode } from 'react';

/**
 * 公开页面组布局。
 * 后续在此挂载公共 Header / Footer。
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
