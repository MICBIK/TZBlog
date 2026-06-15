import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/api/auth';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

export const metadata: Metadata = {
  title: '账户设置',
  description: '管理您的个人资料和账户安全',
};

export default async function AdminSettingsPage() {
  // 获取当前用户信息（需要认证）
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    // 未登录或 token 失效，跳转到登录页
    redirect('/login');
  }

  return (
    <main className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold">账户设置</h1>
        <p className="text-muted-foreground mt-2">
          管理您的个人资料和账户安全设置
        </p>
      </div>

      <SettingsTabs user={user} />
    </main>
  );
}
