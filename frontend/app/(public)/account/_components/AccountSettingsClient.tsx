'use client';

import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { useAuth } from '@/lib/hooks/useAuth';

export function AccountSettingsClient() {
  const { hydrated, isAuthenticated, user } = useAuth();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[960px] px-6 py-12 font-mono text-sm text-muted-foreground">
        loading account...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-[960px] px-6 py-12">
        <div className="rounded-lg border border-line bg-panel p-6">
          <h1 className="text-fg-strong font-sans text-2xl font-bold">
            个人中心
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            当前仅接通真实账户资料与密码修改。请先登录后继续。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] px-6 py-10">
      <div className="mb-8">
        <h1 className="text-fg-strong font-sans text-3xl font-bold">
          账户设置
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          当前页面已接通真实资料更新、头像上传、密码修改与退出登录。
          收藏、点赞、评论历史等个人活动页尚未接入后端，暂不在此页冒充展示。
        </p>
      </div>
      <SettingsTabs user={user} />
    </div>
  );
}
