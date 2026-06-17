'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { login, register } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';
import { ApiRequestError } from '@/types/api';

type Mode = 'login' | 'reg';
type Errors = { name?: string; email?: string; pw?: string; pw2?: string };
type Ok = { text: string; color: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOAST_MS = 2000;

const OK_GREEN = 'var(--acc)';
const OK_RED = 'var(--destructive)';

// 跟随原型的 OAuth 入口：仅 GitHub / Google
const OAUTH = [
  { gi: '⌨', label: '使用 GitHub 继续', primary: true, badge: '推荐', msg: '跳转 GitHub OAuth 授权…' },
  { gi: 'G', label: '使用 Google 继续', primary: false, badge: '', msg: '跳转 Google OAuth 授权…' },
] as const;

const FIELD_INPUT =
  'w-full rounded-[6px] border bg-[var(--panel-2)] px-3 py-[10px] font-mono text-[13.5px] text-[var(--fg-strong)] transition-colors duration-150 focus:border-[var(--acc-dim)] focus:shadow-[0_0_0_3px_rgba(63,224,143,0.08)] focus:outline-none motion-reduce:transition-none';

export function AuthTerminal({ initialMode = 'login' }: { initialMode?: Mode } = {}) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [ok, setOk] = useState<Ok | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReg = mode === 'reg';

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setOk(null);
  }

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), TOAST_MS);
  }

  async function handleSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const next: Errors = {};
    let valid = true;

    if (!EMAIL_RE.test(email.trim())) {
      next.email = '请输入有效的邮箱地址';
      valid = false;
    }
    if (pw.length < 8) {
      next.pw = '密码至少 8 位';
      valid = false;
    }

    let okMsg: Ok | null = null;
    if (isReg) {
      if (!name.trim()) {
        next.name = '请填写用户名';
        valid = false;
      }
      if (pw2 !== pw) {
        next.pw2 = '两次密码不一致';
        valid = false;
      }
      if (!agree) {
        okMsg = { text: '请先同意服务条款', color: OK_RED };
        valid = false;
      }
    }

    setErrors(next);

    if (!valid) {
      setOk(okMsg);
      return;
    }

    setIsSubmitting(true);
    setOk(null);

    try {
      const session = isReg
        ? await register({
            username: name.trim(),
            email: email.trim(),
            password: pw,
            displayName: name.trim(),
          })
        : await login({
            email: email.trim(),
            password: pw,
          });

      setAuth(session.user, session.token);
      setOk({
        text: isReg ? '✓ 账号创建成功，正在跳转…' : '✓ 登录成功，正在跳转…',
        color: OK_GREEN,
      });
      router.replace('/admin');
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : isReg
            ? '注册失败，请稍后重试'
            : '登录失败，请稍后重试';
      setOk({ text: message, color: OK_RED });
    } finally {
      setIsSubmitting(false);
    }
  }

  const cmd = isReg ? 'useradd haiden --register' : 'ssh haiden@tzblog --login';

  return (
    <div className="grid min-h-[100dvh] place-items-center px-6 py-6">
      <div className="relative z-[1] w-full max-w-[420px]">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-[7px] font-mono text-[13px] text-[var(--muted-foreground)] transition-colors duration-150 hover:text-[var(--acc)] motion-reduce:transition-none"
        >
          <span aria-hidden>←</span> 返回 tzblog
        </Link>

        <div className="relative z-[1] overflow-hidden rounded-[11px] border border-[var(--line)] bg-gradient-to-b from-[var(--panel)] to-[var(--bg-2)] shadow-[0_40px_100px_-50px_rgba(0,0,0,0.9)]">
          {/* 终端标题栏 */}
          <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--panel-2)] px-[15px] py-[11px]">
            <span className="size-[11px] rounded-full bg-[#ff5f57]" />
            <span className="size-[11px] rounded-full bg-[#febc2e]" />
            <span className="size-[11px] rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-[12.5px] text-[var(--dim)]">
              auth — haiden@tzblog
            </span>
          </div>

          <div className="p-[26px_28px_28px]">
            <p className="mb-[18px] font-mono text-[13px] text-[var(--muted-foreground)]">
              <span className="text-[var(--acc)]">$</span> <span>{cmd}</span>
            </p>

            {/* tab 切换 */}
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-[8px] border border-[var(--line)] bg-[var(--panel-2)] p-1">
              {(['login', 'reg'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`rounded-[6px] py-[9px] font-mono text-[13.5px] transition-colors duration-150 motion-reduce:transition-none ${
                    mode === m
                      ? 'bg-[rgba(63,224,143,0.1)] text-[var(--acc)]'
                      : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  {m === 'login' ? '登录' : '注册'}
                </button>
              ))}
            </div>

            {/* OAuth */}
            <div className="mb-[18px] flex flex-col gap-[9px]">
              {OAUTH.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => showToast(o.msg)}
                  className={`relative flex w-full items-center gap-[11px] overflow-hidden rounded-[6px] border px-[14px] py-[11px] font-mono text-[13.5px] text-[var(--fg)] transition-colors duration-150 hover:border-[var(--acc-dim)] hover:bg-[var(--panel-2)] motion-reduce:transition-none ${
                    o.primary
                      ? 'border-[var(--acc-dim)] bg-[rgba(63,224,143,0.07)]'
                      : 'border-[var(--line-2)] bg-[var(--panel)]'
                  }`}
                >
                  <span
                    className={`w-[18px] text-center text-[15px] ${o.primary ? 'text-[var(--acc)]' : ''}`}
                  >
                    {o.gi}
                  </span>
                  {o.label}
                  {o.badge && (
                    <span className="ml-auto rounded-[4px] border border-[var(--acc-dim)] px-[6px] py-px text-[10.5px] tracking-[0.08em] text-[var(--acc)]">
                      {o.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 分隔 */}
            <div className="mb-4 mt-[6px] flex items-center gap-3 text-[11.5px] text-[var(--dim)]">
              <span className="h-px flex-1 bg-[var(--line)]" />
              或使用邮箱
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {isReg && (
                <Field label="用户名" error={errors.name}>
                  <input
                    type="text"
                    placeholder="haiden"
                    autoComplete="username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${FIELD_INPUT} ${errors.name ? 'border-[var(--destructive)]' : 'border-[var(--line)]'}`}
                  />
                </Field>
              )}

              <Field label="邮箱" error={errors.email}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${FIELD_INPUT} ${errors.email ? 'border-[var(--destructive)]' : 'border-[var(--line)]'}`}
                />
              </Field>

              <Field label="密码" error={errors.pw}>
                <input
                  type="password"
                  placeholder="至少 8 位"
                  autoComplete={isReg ? 'new-password' : 'current-password'}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className={`${FIELD_INPUT} ${errors.pw ? 'border-[var(--destructive)]' : 'border-[var(--line)]'}`}
                />
              </Field>

              {isReg && (
                <Field label="确认密码" error={errors.pw2}>
                  <input
                    type="password"
                    placeholder="再输一次"
                    autoComplete="new-password"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    className={`${FIELD_INPUT} ${errors.pw2 ? 'border-[var(--destructive)]' : 'border-[var(--line)]'}`}
                  />
                </Field>
              )}

              {!isReg ? (
                <div className="my-[4px_0_18px] flex items-center justify-between text-[12.5px]">
                  <label className="flex cursor-pointer items-center gap-[7px] font-sans text-[var(--muted-foreground)]">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="accent-[var(--acc)]"
                    />
                    记住我
                  </label>
                  <button
                    type="button"
                    onClick={() => showToast('重置链接已发送到邮箱')}
                    className="text-[var(--muted-foreground)] transition-colors duration-150 hover:text-[var(--acc)] motion-reduce:transition-none"
                  >
                    忘记密码？
                  </button>
                </div>
              ) : (
                <div className="my-[4px_0_18px] flex items-center justify-between text-[12.5px]">
                  <label className="flex cursor-pointer items-center gap-[7px] font-sans text-[var(--muted-foreground)]">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="accent-[var(--acc)]"
                    />
                    我已阅读并同意服务条款
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full overflow-hidden rounded-[6px] bg-[var(--acc)] p-3 font-mono text-[14px] font-bold text-[#06120b] transition-shadow duration-150 hover:shadow-[0_0_0_3px_rgba(63,224,143,0.2)] disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none"
              >
                <span className="opacity-55">$ </span>
                {isSubmitting ? '处理中…' : isReg ? '创建账号' : '登录'}
              </button>

              <button
                type="button"
                onClick={() => showToast('一次性登录链接已发送，请查收邮箱')}
                className="mt-[9px] w-full rounded-[6px] border border-dashed border-[var(--line-2)] bg-transparent p-[11px] font-mono text-[13px] text-[var(--muted-foreground)] transition-colors duration-150 hover:border-[var(--acc-dim)] hover:text-[var(--acc)] motion-reduce:transition-none"
              >
                ✉ 改用邮箱魔法链接登录
              </button>

              <div
                className="mt-3 min-h-[1.4em] text-center font-mono text-[12.5px]"
                style={{ color: ok?.color }}
              >
                {ok?.text ?? ''}
              </div>
            </form>

            <p className="mt-[18px] text-center font-sans text-[11.5px] leading-[1.6] text-[var(--dim)]">
              本站仅支持 GitHub / Google / 邮箱 / 魔法链接登录，不接入短信、微信、微博、QQ。匿名也可完整阅读全文。
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[99] -translate-x-1/2 rounded-[8px] border border-[#2a343f] bg-[#11171f] px-4 py-[10px] font-mono text-[13px] leading-[1.5] text-[var(--acc)] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {toast}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-[13px]">
      <label className="mb-[6px] block font-sans text-[12.5px] text-[var(--muted-foreground)]">
        {label}
      </label>
      {children}
      <div className="mt-1 min-h-[1.2em] font-sans text-[11.5px] text-[var(--destructive)]">
        {error ?? ''}
      </div>
    </div>
  );
}
