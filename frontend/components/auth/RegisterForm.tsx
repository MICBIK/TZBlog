'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { register as registerApi } from '@/lib/api/auth';
import { ApiRequestError } from '@/types/api';
import { useAuthStore } from '@/lib/store/authStore';
import { MOCK_USE_MOCK, mockAuthSession, mockDelay } from '@/lib/mock/data';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, '用户名至少 3 位')
      .max(20, '用户名最多 20 位')
      .regex(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字、下划线'),
    email: z.string().email('请输入有效的邮箱地址'),
    password: z
      .string()
      .min(8, '密码至少 8 位')
      .regex(/[A-Za-z]/, '需包含字母')
      .regex(/[0-9]/, '需包含数字'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });
type RegisterValues = z.infer<typeof registerSchema>;

const fieldClass =
  'border-border bg-secondary font-mono focus-visible:border-[var(--acc-dim)] focus-visible:ring-[3px] focus-visible:ring-primary/[0.08]';

export function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    try {
      const session = MOCK_USE_MOCK
        ? (await mockDelay(), mockAuthSession)
        : await registerApi({
            username: values.username,
            email: values.email,
            password: values.password,
          });
      setAuth(session.user, session.token);
      toast.success('注册成功');
      router.push('/admin');
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError ? err.message : '注册失败，请重试',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted font-mono text-xs">
                用户名
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="haiden"
                  autoComplete="username"
                  className={fieldClass}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted font-mono text-xs">
                邮箱
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={fieldClass}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted font-mono text-xs">
                密码
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="至少 8 位，含字母和数字"
                  autoComplete="new-password"
                  className={fieldClass}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted font-mono text-xs">
                确认密码
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  className={fieldClass}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="bg-primary w-full font-mono text-sm font-bold text-[#06120b] hover:shadow-[0_0_0_3px_rgba(63,224,143,0.2)]"
          disabled={submitting}
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          <span className="opacity-55">$ </span>
          注册
        </Button>
        <p className="pt-1 text-center font-mono text-[11.5px] text-[var(--dim)]">
          已有账户？
          <Link href="/login" className="text-primary ml-1 hover:underline">
            登录
          </Link>
        </p>
      </form>
    </Form>
  );
}
