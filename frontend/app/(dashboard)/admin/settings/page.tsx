import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '设置',
  description: '账户与站点设置',
};

export default function AdminSettingsPage() {
  return (
    <main>
      <h1 className="mb-6 text-3xl font-bold">设置</h1>
      <p className="text-muted-foreground">
        设置页（占位）。后续将提供账户信息、个人资料等配置。
      </p>
    </main>
  );
}
