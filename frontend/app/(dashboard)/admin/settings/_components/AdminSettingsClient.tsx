'use client';

import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { useAuth } from '@/lib/hooks/useAuth';

export function AdminSettingsClient() {
  const { hydrated, user } = useAuth();

  if (!hydrated) {
    return (
      <div className="rounded-lg border border-line bg-panel p-6 font-mono text-sm text-muted-foreground">
        loading settings...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-line bg-panel p-6 text-sm text-muted-foreground">
        无法加载当前用户信息，请重新登录后再试。
      </div>
    );
  }

  return <SettingsTabs user={user} />;
}
