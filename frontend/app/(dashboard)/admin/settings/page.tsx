import type { Metadata } from 'next';

import { AdminSettingsClient } from './_components/AdminSettingsClient';

export const metadata: Metadata = {
  title: '站点设置 · tzblog',
  description: 'tzblog 后台站点设置',
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return (
    <main className="mx-auto max-w-[960px] px-6 py-10">
      <div className="mb-8">
        <h1 className="text-fg-strong font-sans text-3xl font-bold">
          后台设置
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          站点级配置保存接口当前后端未提供，已移除原型态的“保存成功”假交互。
          目前仅保留真实可用的账户资料与密码修改。
        </p>
      </div>
      <AdminSettingsClient />
    </main>
  );
}
