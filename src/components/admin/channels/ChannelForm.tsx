"use client";

import * as React from "react";

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
  const [slug, setSlug] = React.useState("");
  const [kind, setKind] = React.useState<(typeof KIND_OPTIONS)[number]>("ARTICLES");
  const allowedLayouts = getAllowedLayoutsForChannelKind(kind);
  const [layout, setLayout] = React.useState<(typeof allowedLayouts)[number]>(
    allowedLayouts[0],
  );

  React.useEffect(() => {
    setLayout(allowedLayouts[0]);
  }, [allowedLayouts, kind]);

  return (
    <form className="grid gap-6">
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
          onChange={(event) => setKind(event.target.value as (typeof KIND_OPTIONS)[number])}
          className="mt-3 w-full rounded border border-border px-3 py-2 text-sm"
        >
          {KIND_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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
    </form>
  );
}

export default ChannelForm;
