"use client";

import { useRef, useState } from "react";

export interface NotionMarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
}

const slashCommands = [
  { label: "Paragraph", markdown: "段落" },
  { label: "Heading 2", markdown: "## 标题" },
  { label: "Bullet List", markdown: "- 列表项" },
  { label: "Numbered List", markdown: "1. 列表项" },
  { label: "Quote", markdown: "> 引用" },
  { label: "Code Block", markdown: "```\n代码\n```" },
  { label: "Image", markdown: "![alt](url)" },
  {
    label: "Table",
    markdown: "| 列 | 值 |\n| --- | --- |\n| 示例 | 内容 |",
  },
  { label: "Callout", markdown: "> [!NOTE]\n> 内容" },
];

export function NotionMarkdownEditor({
  value,
  onChange,
}: NotionMarkdownEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const insertCommand = (markdown: string) => {
    onChange(markdown);
    setMenuOpen(false);
    editorRef.current?.focus();
  };

  return (
    <div className="relative">
      <textarea
        ref={editorRef}
        aria-label="文章内容"
        value={value}
        onChange={(event) => {
          const next = event.currentTarget.value;
          setMenuOpen(next.endsWith("/"));
          onChange(next);
        }}
      />

      {menuOpen ? (
        <div
          role="menu"
          aria-label="Block commands"
          className="absolute z-10 mt-2 flex w-56 flex-col rounded-md border border-border bg-bg p-1 shadow-soft"
        >
          {slashCommands.map((command) => (
            <button
              key={command.label}
              type="button"
              role="menuitem"
              className="rounded px-2 py-1 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              onClick={() => insertCommand(command.markdown)}
            >
              {command.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
