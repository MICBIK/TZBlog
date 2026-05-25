"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { getAllowedLayoutsForChannelKind } from "@/lib/schemas/channelEntryRules";

const KIND_OPTIONS = [
  "ARTICLES",
  "NOTES",
  "LINKS",
  "STREAM",
  "GUESTBOOK",
  "CUSTOM",
] as const;

export function ChannelForm() {
  const router = useRouter();
  const [slug, setSlug] = React.useState("");
  const [kind, setKind] = React.useState<(typeof KIND_OPTIONS)[number]>("ARTICLES");
  const allowedLayouts = getAllowedLayoutsForChannelKind(kind);
  const [layout, setLayout] = React.useState<(typeof allowedLayouts)[number]>(
    allowedLayouts[0],
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          kind,
          layout,
        }),
      });

      if (!response.ok) {
        setSubmitError("创建频道失败");
        return;
      }

      const payload = (await response.json()) as { data?: { id?: string } };
      const id = payload.data?.id;
      if (id) {
        router.push(`/admin/channels/${id}/edit`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={(event) => void handleSubmit(event)}>
      <section className="rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">Slug</h2>
        <input
          aria-label="Slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="mt-3 w-full rounded border border-border px-3 py-2 text-sm"
        />
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">频道类型</h2>
        <select
          aria-label="频道类型"
          value={kind}
          onChange={(event) => {
            const nextKind = event.target.value as (typeof KIND_OPTIONS)[number];
            setKind(nextKind);
            setLayout(getAllowedLayoutsForChannelKind(nextKind)[0]);
          }}
          className="mt-3 w-full rounded border border-border px-3 py-2 text-sm"
        >
          {KIND_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {kind === "GUESTBOOK" ? (
          <p className="mt-3 text-sm text-destructive">
            GUESTBOOK 由 seed 创建，admin 不能新建
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">布局</h2>
        <select
          aria-label="布局"
          value={layout}
          onChange={(event) =>
            setLayout(event.target.value as (typeof allowedLayouts)[number])
          }
          className="mt-3 w-full rounded border border-border px-3 py-2 text-sm"
        >
          {allowedLayouts.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">主题与强调</h2>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">翻译</h2>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">可见性</h2>
      </section>

      {submitError ? (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || kind === "GUESTBOOK"}
          className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {submitting ? "创建中..." : "创建频道"}
        </button>
      </div>
    </form>
  );
}

export default ChannelForm;
