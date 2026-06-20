import type { Metadata } from 'next';

import { AccountSettingsClient } from './_components/AccountSettingsClient';

export const metadata: Metadata = {
  title: '我的 · 个人中心 — tzblog',
  // 对照原型 account.html <meta name="robots" content="noindex, nofollow">
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <main className="flex-1 pb-[60px] pt-9">
      <AccountSettingsClient />
    </main>
  );
}
