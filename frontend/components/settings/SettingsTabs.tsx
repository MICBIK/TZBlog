'use client';

import { Lock, User } from 'lucide-react';

import type { AuthUser } from '@/types/auth';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { PasswordForm } from '@/components/settings/PasswordForm';

interface SettingsTabsProps {
  user: AuthUser;
}

export function SettingsTabs({ user }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList variant="line" className="mb-8">
        <TabsTrigger value="profile">
          <User className="size-4" />
          个人资料
        </TabsTrigger>
        <TabsTrigger value="password">
          <Lock className="size-4" />
          修改密码
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileForm user={user} />
      </TabsContent>

      <TabsContent value="password">
        <PasswordForm />
      </TabsContent>
    </Tabs>
  );
}
