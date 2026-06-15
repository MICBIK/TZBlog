'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { changePassword } from '@/lib/api/auth';
import { ApiRequestError } from '@/types/api';
import { useAuthStore } from '@/lib/store/authStore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z
      .string()
      .min(8, '密码至少 8 位')
      .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
      .regex(/[a-z]/, '密码必须包含至少一个小写字母')
      .regex(/[0-9]/, '密码必须包含至少一个数字'),
    confirmPassword: z.string().min(1, '请确认新密码'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function PasswordForm() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [submitting, setSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  // 密码强度计算
  function getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
  } {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: '弱', color: 'bg-destructive' };
    if (score <= 3) return { score, label: '中', color: 'bg-yellow-500' };
    return { score, label: '强', color: 'bg-green-500' };
  }

  const strength = getPasswordStrength(newPassword);

  async function onSubmit(data: PasswordFormValues) {
    setSubmitting(true);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success('密码已更新，请重新登录');

      // 清除登录状态并跳转
      logout();
      router.push('/login');
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : '修改失败，请重试';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 当前密码 */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">当前密码</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrent ? 'text' : 'password'}
            placeholder="输入当前密码"
            {...register('currentPassword')}
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
            aria-label={showCurrent ? '隐藏密码' : '显示密码'}
          >
            {showCurrent ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="text-destructive text-sm">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      {/* 新密码 */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">新密码</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNew ? 'text' : 'password'}
            placeholder="输入新密码"
            {...register('newPassword')}
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
            aria-label={showNew ? '隐藏密码' : '显示密码'}
          >
            {showNew ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-destructive text-sm">
            {errors.newPassword.message}
          </p>
        )}

        {/* 密码强度指示器 */}
        {newPassword && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                <div
                  className={`h-full transition-all ${strength.color}`}
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs">
                {strength.label}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              密码要求：至少 8 位，包含大小写字母和数字
            </p>
          </div>
        )}
      </div>

      {/* 确认密码 */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">确认新密码</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="再次输入新密码"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
            aria-label={showConfirm ? '隐藏密码' : '显示密码'}
          >
            {showConfirm ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-destructive text-sm">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* 警告提示 */}
      <div className="bg-yellow-500/10 border-yellow-500/50 rounded-lg border p-4">
        <p className="text-yellow-600 dark:text-yellow-500 text-sm">
          ⚠️ 修改密码后，您将被自动退出登录，需要使用新密码重新登录。
        </p>
      </div>

      {/* 提交按钮 */}
      <div className="border-border flex justify-end border-t pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          <Lock className="size-4" />
          修改密码
        </Button>
      </div>
    </form>
  );
}
