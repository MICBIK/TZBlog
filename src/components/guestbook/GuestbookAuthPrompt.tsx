import Link from "next/link";

export function GuestbookAuthPrompt() {
  return (
    <section
      data-guestbook-auth="magic-link"
      className="rounded-lg border border-border p-6"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">邮箱 magic link 登录</h2>
        <p className="text-sm text-muted-fg">
          登录后才能发送私密留言。我们会向您的邮箱发送一次性登录链接。
        </p>
      </div>
      <Link
        href="/login?from=/guestbook"
        className="mt-6 inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90"
      >
        前往登录
      </Link>
    </section>
  );
}
