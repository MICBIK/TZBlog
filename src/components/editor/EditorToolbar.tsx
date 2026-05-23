"use client";

import type { MarkdownSourceApi } from "./MarkdownEditor";

interface EditorToolbarProps {
  source: MarkdownSourceApi | null;
}

interface ToolButtonProps {
  label: string;
  marker: string;
  disabled?: boolean;
  onClick: () => void;
}

const TOOLBAR_ITEMS = [
  { label: "加粗 Bold ⌘B", marker: "B" },
  { label: "斜体 Italic ⌘I", marker: "I" },
  { label: "行内代码 Code ⌘E", marker: "`" },
  { label: "二级标题 H2 ⌘⌥2", marker: "H2" },
  { label: "三级标题 H3 ⌘⌥3", marker: "H3" },
  { label: "无序列表 UL ⌘⇧8", marker: "UL" },
  { label: "有序列表 OL ⌘⇧7", marker: "OL" },
  { label: "引用 Quote", marker: ">" },
  { label: "代码块 Code Block", marker: "{}" },
  { label: "链接 Link ⌘K", marker: "[]" },
  { label: "图片 Image", marker: "IMG" },
  { label: "表格 Table", marker: "TBL" },
  { label: "提示块 Callout NOTE", marker: "!" },
] as const;

export function EditorToolbar({ source }: EditorToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Markdown source toolbar"
      className="flex flex-wrap items-center gap-1 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-2"
    >
      {TOOLBAR_ITEMS.map((item) => (
        <ToolButton
          key={item.label}
          label={item.label}
          marker={item.marker}
          disabled={!source}
          onClick={() => source?.focus()}
        />
      ))}
    </div>
  );
}

function ToolButton({ label, marker, disabled, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={[
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 font-mono text-xs transition-colors",
        "border-[hsl(var(--border))] bg-transparent text-[hsl(var(--fg))]",
        "hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--accent))]",
        "disabled:pointer-events-none disabled:opacity-50",
      ].join(" ")}
    >
      {marker}
    </button>
  );
}

export default EditorToolbar;
