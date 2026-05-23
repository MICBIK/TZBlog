"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";

import { loginSchema, type LoginInput } from "@/lib/schemas/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") ?? "/admin";
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!res || res.error) {
        setFormError("邮箱或密码不正确");
        return;
      }

      router.push(fromParam);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">登录</h1>
      <p className="mb-6 text-sm text-[hsl(var(--muted-fg))]">
        访问 TZBlog 后台管理。
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-[hsl(var(--fg))]"
          >
            邮箱
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            {...register("email")}
            className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
          {errors.email && (
            <span className="text-xs text-red-500">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-[hsl(var(--fg))]"
          >
            密码
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className="h-10 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
          {errors.password && (
            <span className="text-xs text-red-500">
              {errors.password.message}
            </span>
          )}
        </div>

        {formError && (
          <div
            role="alert"
            className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500"
          >
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="h-10 rounded-md bg-[hsl(var(--accent))] px-4 text-sm font-medium text-[hsl(var(--bg))] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "正在登录..." : "登录"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[hsl(var(--bg))] px-4 text-[hsl(var(--fg))]">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
