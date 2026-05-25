export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted-fg">
        403
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">禁止访问</h1>
      <p className="max-w-prose text-sm text-muted-fg">
        当前操作不被允许。管理员不能手动创建 GUESTBOOK_THREAD 条目。
      </p>
    </main>
  );
}
