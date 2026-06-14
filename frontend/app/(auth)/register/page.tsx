import type { Metadata } from 'next';

import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: '注册',
  description: '注册 TZBlog 账户',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
