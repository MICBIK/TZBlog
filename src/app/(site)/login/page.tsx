"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";

import {
  loginSchema,
  visitorEmailSchema,
  type LoginInput,
  type VisitorEmailInput,
} from "@/lib/schemas/auth";

const VISITOR_SUCCESS_MESSAGE = "如该邮箱有效，登录链接已发送";
const RATE_LIMIT_MESSAGE = "请求过多，请稍后再试";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") ?? "/admin";
  const [visitorMessage, setVisitorMessage] = useState<string | null>(null);
  const [visitorSubmitting, setVisitorSubmitting] = useState(false);
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const visitorForm = useForm<VisitorEmailInput>({
    resolver: zodResolver(visitorEmailSchema),
    defaultValues: { email: "" },
  });

  const adminForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onVisitorSubmit(values: VisitorEmailInput) {
    setVisitorMessage(null);
    setVisitorSubmitting(true);
    try {
      const res = await signIn("email", {
        email: values.email,
        redirect: false,
      });

      if (res?.error === "RateLimited") {
        setVisitorMessage(RATE_LIMIT_MESSAGE);
        return;
      }

      setVisitorMessage(VISITOR_SUCCESS_MESSAGE);
    } catch {
      setVisitorMessage(VISITOR_SUCCESS_MESSAGE);
    } finally {
      setVisitorSubmitting(false);
    }
  }

  async function onAdminSubmit(values: LoginInput) {
    setAdminError(null);
    setAdminSubmitting(true);
    try {
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!res || res.error) {
        setAdminError("邮箱或密码不正确");
        return;
      }

      router.push(fromParam);
      router.refresh();
    } finally {
      setAdminSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-10 px-4 py-16">
      <header className="space-y-2 text-center">
        <p className="font-mono text-xs uppercase tracking-normal text-muted-fg">
          TZBlog
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">登录</h1>
      </header>

      <section
        aria-labelledby="visitor-login-heading"
        className="rounded-xl border border-border bg-bg p-6 shadow-sm"
      >
        <h2 id="visitor-login-heading" className="text-lg font-semibold">
          访客登录
        </h2>
        <p className="mt-2 text-sm text-muted-fg">
          我们会向您的邮箱发送一次性登录链接。
        </p>

        <form
          onSubmit={visitorForm.handleSubmit(onVisitorSubmit)}
          className="mt-6 flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="visitor-email" className="text-sm font-medium">
              邮箱
            </label>
            <input
              id="visitor-email"
              type="email"
              autoComplete="email"
              {...visitorForm.register("email")}
              className="h-10 rounded-md border border-border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {visitorForm.formState.errors.email && (
              <span className="text-xs text-red-500">
                {visitorForm.formState.errors.email.message}
              </span>
            )}
          </div>

          {visitorMessage && (
            <div
              role="status"
              className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              {visitorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={visitorSubmitting}
            className="h-10 rounded-md bg-accent px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {visitorSubmitting ? "正在发送..." : "获取登录链接"}
          </button>
        </form>
      </section>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-fg">
        <span className="h-px flex-1 bg-border" />
        <span>管理员入口</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <section
        aria-labelledby="admin-login-heading"
        className="rounded-xl border border-border bg-bg p-6 shadow-sm"
      >
        <h2 id="admin-login-heading" className="text-lg font-semibold">
          管理员入口
        </h2>

        <form
          onSubmit={adminForm.handleSubmit(onAdminSubmit)}
          className="mt-6 flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-email" className="text-sm font-medium">
              邮箱
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              {...adminForm.register("email")}
              className="h-10 rounded-md border border-border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {adminForm.formState.errors.email && (
              <span className="text-xs text-red-500">
                {adminForm.formState.errors.email.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-password" className="text-sm font-medium">
              密码
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              {...adminForm.register("password")}
              className="h-10 rounded-md border border-border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {adminForm.formState.errors.password && (
              <span className="text-xs text-red-500">
                {adminForm.formState.errors.password.message}
              </span>
            )}
          </div>

          {adminError && (
            <div
              role="alert"
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500"
            >
              {adminError}
            </div>
          )}

          <button
            type="submit"
            disabled={adminSubmitting}
            className="h-10 rounded-md bg-accent px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {adminSubmitting ? "正在登录..." : "登录"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
