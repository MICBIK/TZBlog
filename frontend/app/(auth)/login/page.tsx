import type { Metadata } from 'next';

import { AuthTerminal } from '@/components/auth/AuthTerminal';

export const metadata: Metadata = {
  title: '登录 / 注册 · tzblog',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <AuthTerminal />;
}
