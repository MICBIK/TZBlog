"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GuestbookStartForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/guestbook/threads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const body = (await res.json()) as {
        error?: { message?: string };
      };

      if (!res.ok) {
        setError(body.error?.message ?? "发送失败，请稍后再试");
        return;
      }

      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-border p-6" data-testid="guestbook-start-form">
      <h2 className="text-xl font-semibold">开始新对话</h2>
      <p className="mt-2 text-sm text-muted-fg">
        还没有历史留言。写下第一条消息，HaiDen 会在后台看到并回复。
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
        <label htmlFor="guestbook-start-content" className="text-sm font-medium">
          留言内容
        </label>
        <textarea
          id="guestbook-start-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={5}
          maxLength={2000}
          required
          className="rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="h-11 rounded-md bg-accent px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "发送中..." : "发送第一条留言"}
        </button>
      </form>
    </section>
  );
}
