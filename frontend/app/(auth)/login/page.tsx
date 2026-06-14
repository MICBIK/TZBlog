import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: '登录',
  description: '登录 TZBlog',
};

export default function LoginPage() {
  return <LoginForm />;
}
