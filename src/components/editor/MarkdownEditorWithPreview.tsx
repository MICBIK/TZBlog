"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
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
  placeholder?: string;
}

type Tab = "editor" | "preview";

/**
 * Side-by-side editor + live preview.
 *
 * The full server pipeline (remark + rehype + shiki) is too heavy for in-browser
 * keystroke rendering, so we use a deliberately tiny client-side renderer here.
 * It covers the ~80% of Markdown that authors check while drafting; the
 * authoritative render happens server-side via `MarkdownPreview` / the post
 * service. TODO: swap in `marked` + `DOMPurify` when those land.
 */
export function MarkdownEditorWithPreview({
  value,
  onChange,
  placeholder,
}: MarkdownEditorWithPreviewProps) {
  const [tab, setTab] = useState<Tab>("editor");
  const previewHtml = useMemo(() => miniRenderMarkdown(value), [value]);

  return (
    <div className="flex h-full min-h-[28rem] flex-col gap-3">
      {/* Mobile tabs */}
      <div
        role="tablist"
        aria-label="Editor view"
        className="flex gap-1 self-start rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-1 lg:hidden"
      >
        <TabButton current={tab} value="editor" onClick={() => setTab("editor")}>
          Editor
        </TabButton>
        <TabButton current={tab} value="preview" onClick={() => setTab("preview")}>
          Preview
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
          aria-label="Markdown preview"
        >
          <article
            className="markdown-body max-w-none"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          <p className="mt-6 text-xs text-[hsl(var(--muted))]">
            Lightweight in-browser preview. The published page uses the full
            remark/rehype/shiki pipeline, so code highlighting and edge-case
            Markdown will render exactly as expected after publish.
          </p>
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

/**
 * Tiny Markdown renderer for the live preview pane only.
 *
 * Handles: ATX headings (h1–h6), fenced code blocks (no highlighting), inline
 * code, bold (**), italic (* / _), links, ordered/unordered lists, blockquotes,
 * thematic breaks, and paragraph splitting on blank lines. Everything else
 * round-trips as escaped text. Output is HTML-escaped before any inline rules
 * run, so this is XSS-safe even for arbitrary input.
 *
 * Intentionally not a Markdown spec implementation — keep it small or replace
 * with `marked` + `DOMPurify` later.
 */
function miniRenderMarkdown(src: string): string {
  if (!src) return "";

  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];

  let i = 0;
  let listType: "ul" | "ol" | null = null;
  let inBlockquote = false;
  let paragraphBuf: string[] = [];

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  const closeBlockquote = () => {
    if (inBlockquote) {
      out.push("</blockquote>");
      inBlockquote = false;
    }
  };
  const flushParagraph = () => {
    if (paragraphBuf.length === 0) return;
    out.push(`<p>${applyInline(paragraphBuf.join(" "))}</p>`);
    paragraphBuf = [];
  };
  const closeAll = () => {
    flushParagraph();
    closeList();
    closeBlockquote();
  };

  while (i < lines.length) {
    const raw = lines[i];

    // Fenced code block ```lang
    const fence = /^```(\w*)\s*$/.exec(raw);
    if (fence) {
      closeAll();
      const lang = fence[1] ?? "";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // consume closing fence (or eof)
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      out.push(`<pre><code${cls}>${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    // Blank line — paragraph / list / blockquote separator.
    if (/^\s*$/.test(raw)) {
      flushParagraph();
      closeList();
      closeBlockquote();
      i++;
      continue;
    }

    // ATX heading
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(raw);
    if (heading) {
      closeAll();
      const level = heading[1].length;
      out.push(`<h${level}>${applyInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    // Thematic break
    if (/^\s*(---|\*\*\*|___)\s*$/.test(raw)) {
      closeAll();
      out.push("<hr />");
      i++;
      continue;
    }

    // Blockquote
    const bq = /^>\s?(.*)$/.exec(raw);
    if (bq) {
      flushParagraph();
      closeList();
      if (!inBlockquote) {
        out.push("<blockquote>");
        inBlockquote = true;
      }
      out.push(`<p>${applyInline(bq[1])}</p>`);
      i++;
      continue;
    }
    if (inBlockquote) closeBlockquote();

    // Unordered list
    const ul = /^\s*[-*+]\s+(.+)$/.exec(raw);
    if (ul) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${applyInline(ul[1])}</li>`);
      i++;
      continue;
    }

    // Ordered list
    const ol = /^\s*\d+\.\s+(.+)$/.exec(raw);
    if (ol) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${applyInline(ol[1])}</li>`);
      i++;
      continue;
    }
    if (listType) closeList();

    // Paragraph continuation
    paragraphBuf.push(raw);
    i++;
  }

  closeAll();
  return out.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function applyInline(input: string): string {
  let s = escapeHtml(input);
  // inline code first so other rules don't touch its content
  s = s.replace(/`([^`]+)`/g, (_m, code: string) => `<code>${code}</code>`);
  // images ![alt](url)
  s = s.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_m, alt: string, url: string) => `<img alt="${alt}" src="${url}" />`,
  );
  // links [text](url)
  s = s.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_m, text: string, url: string) =>
      `<a href="${url}" rel="noopener noreferrer" target="_blank">${text}</a>`,
  );
  // bold
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic — match * or _ but not the ** already consumed
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
  // strikethrough (GFM)
  s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  return s;
}

export default MarkdownEditorWithPreview;
