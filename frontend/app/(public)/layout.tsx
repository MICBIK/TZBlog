import type { ReactNode } from 'react';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

/**
 * 公开页面组布局。
 * 挂载命令行风格 Header + Footer。
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
