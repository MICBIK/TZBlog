'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { updateProfile } from '@/lib/api/auth';
import { ApiRequestError } from '@/types/api';
import type { AuthUser } from '@/types/auth';
import { useAuthStore } from '@/lib/store/authStore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AvatarUpload } from '@/components/settings/AvatarUpload';

const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, '请输入显示名称')
    .max(50, '显示名称最多 50 字'),
  bio: z.string().max(500, '个人简介最多 500 字').optional(),
  avatarUrl: z.string().url('请输入有效的图片链接').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: AuthUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const updateUser = useAuthStore((state) => state.updateUser);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.displayName,
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
    },
  });

  const avatarUrl = watch('avatarUrl');

  async function onSubmit(data: ProfileFormValues) {
    setSubmitting(true);
    try {
      const updatedUser = await updateProfile({
        displayName: data.displayName,
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || '',
      });

      // 更新 Zustand store
      updateUser(updatedUser);

      toast.success('个人资料已更新');
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : '更新失败，请重试';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 头像 */}
      <div className="space-y-2">
        <Label>头像</Label>
        <AvatarUpload
          currentUrl={avatarUrl}
          onUploaded={(url) => setValue('avatarUrl', url)}
        />
      </div>

      {/* 显示名称 */}
      <div className="space-y-2">
        <Label htmlFor="displayName">显示名称</Label>
        <Input
          id="displayName"
          placeholder="你的昵称"
          {...register('displayName')}
        />
        {errors.displayName && (
          <p className="text-destructive text-sm">
            {errors.displayName.message}
          </p>
        )}
      </div>

      {/* 个人简介 */}
      <div className="space-y-2">
        <Label htmlFor="bio">个人简介</Label>
        <Textarea
          id="bio"
          placeholder="介绍一下你自己…"
          rows={4}
          {...register('bio')}
        />
        {errors.bio && (
          <p className="text-destructive text-sm">{errors.bio.message}</p>
        )}
        <p className="text-muted-foreground text-xs">
          {watch('bio')?.length ?? 0} / 500
        </p>
      </div>

      {/* 只读字段显示 */}
      <div className="border-border space-y-3 rounded-lg border bg-muted/30 p-4">
        <div className="text-sm">
          <span className="text-muted-foreground">用户名：</span>
          <span className="font-mono">{user.username}</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">邮箱：</span>
          <span className="font-mono">{user.email}</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">角色：</span>
          <span className="font-mono">{user.role}</span>
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="border-border flex justify-end border-t pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          <Save className="size-4" />
          保存修改
        </Button>
      </div>
    </form>
  );
}
