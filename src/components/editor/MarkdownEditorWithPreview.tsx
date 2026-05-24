"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MarkdownCopyButtons } from "@/components/markdown/MarkdownCopyButtons";
import type { MarkdownEditorProps } from "./MarkdownEditor";

const MarkdownEditor = dynamic<MarkdownEditorProps>(
  () => import("./MarkdownEditor").then((mod) => mod.MarkdownEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[24rem] items-center justify-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg))] text-sm text-[hsl(var(--muted-fg))]">
        正在加载编辑器...
      </div>
    ),
  },
);

export interface MarkdownEditorWithPreviewProps {
  value: string;
  onChange: (markdown: string) => void;
  onSave?: () => void;
  placeholder?: string;
}

type Tab = "editor" | "preview";

/**
 * Side-by-side Markdown source editor + live preview.
 *
 * The preview uses the same full renderMarkdown pipeline as published posts,
 * with a debounce so typing stays responsive.
 */
export function MarkdownEditorWithPreview({
  value,
  onChange,
  onSave,
  placeholder,
}: MarkdownEditorWithPreviewProps) {
  const [tab, setTab] = useState<Tab>("editor");

  return (
    <div className="flex h-full min-h-[28rem] flex-col gap-3">
      {/* Mobile tabs */}
      <div
        role="tablist"
        aria-label="编辑视图"
        className="flex gap-1 self-start rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-1 lg:hidden"
      >
        <TabButton current={tab} value="editor" onClick={() => setTab("editor")}>
          编辑
        </TabButton>
        <TabButton current={tab} value="preview" onClick={() => setTab("preview")}>
          预览
        </TabButton>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <div
          className={[
            "min-h-[24rem]",
            tab === "editor" ? "block" : "hidden",
            "lg:block",
          ].join(" ")}
        >
          <MarkdownEditor
            value={value}
            onChange={onChange}
            onSave={onSave}
            placeholder={placeholder}
            className="h-full"
          />
        </div>

        <div
          className={[
            "min-h-[24rem] overflow-auto rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4",
            tab === "preview" ? "block" : "hidden",
            "lg:block",
          ].join(" ")}
          aria-label="Markdown 预览"
        >
          <MarkdownLivePreview value={value} />
        </div>
      </div>
    </div>
  );
}

function TabButton({
  current,
  value,
  onClick,
  children,
}: {
  current: Tab;
  value: Tab;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "rounded px-3 py-1 text-sm transition-colors",
        active
          ? "bg-[hsl(var(--muted))] text-[hsl(var(--fg))]"
          : "text-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function MarkdownLivePreview({ value }: { value: string }) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderPreview() {
      try {
        const { renderMarkdown } = await import("@/lib/markdown");
        const nextHtml = await renderMarkdown(value);
        if (cancelled) return;
        setHtml(nextHtml);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Markdown 预览失败");
      }
    }

    const timer = window.setTimeout(() => {
      void renderPreview();
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  return (
    <>
      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-md border border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 p-3 text-sm text-[hsl(var(--destructive))]"
        >
          {error}
        </div>
      ) : null}
      <article
        className="markdown-body max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <MarkdownCopyButtons />
    </>
  );
}

export default MarkdownEditorWithPreview;
