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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

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
      let session;
      if (MOCK_USE_MOCK) {
        await mockDelay();
        session = mockAuthSession;
      } else {
        session = await registerApi({
          username: values.username,
          email: values.email,
          password: values.password,
        });
      }
      setAuth(session.user, session.token);
      toast.success('注册成功');
      router.push('/admin');
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : '注册失败，请重试';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono">注册</CardTitle>
        <CardDescription>创建你的 TZBlog 账户</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="zhangsan"
                      autoComplete="username"
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
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
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
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="至少 8 位，含字母和数字"
                      autoComplete="new-password"
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
                  <FormLabel>确认密码</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              注册
            </Button>
            <p className="text-muted-foreground text-sm">
              已有账户？
              <Link href="/login" className="text-primary ml-1 hover:underline">
                登录
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
