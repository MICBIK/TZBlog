'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { login } from '@/lib/api/auth';
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

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少 8 位'),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      const session = MOCK_USE_MOCK
        ? (await mockDelay(), mockAuthSession)
        : await login(values);
      setAuth(session.user, session.token);
      toast.success('登录成功');
      router.push('/admin');
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError ? err.message : '登录失败，请重试',
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
                  className="border-border bg-secondary focus-visible:ring-primary/[0.08] font-mono focus-visible:border-[var(--acc-dim)] focus-visible:ring-[3px]"
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
                  placeholder="至少 8 位"
                  autoComplete="current-password"
                  className="border-border bg-secondary focus-visible:ring-primary/[0.08] font-mono focus-visible:border-[var(--acc-dim)] focus-visible:ring-[3px]"
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
          登录
        </Button>
        <p className="pt-1 text-center font-mono text-[11.5px] text-[var(--dim)]">
          还没有账户？
          <Link href="/register" className="text-primary ml-1 hover:underline">
            注册
          </Link>
        </p>
      </form>
    </Form>
  );
}
