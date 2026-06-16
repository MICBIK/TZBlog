import type { Metadata } from 'next';

import { SettingsWorkspace } from './_components/SettingsWorkspace';

export const metadata: Metadata = {
  title: '站点设置 · tzblog',
  description: 'tzblog 后台站点设置',
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return <SettingsWorkspace />;
}
