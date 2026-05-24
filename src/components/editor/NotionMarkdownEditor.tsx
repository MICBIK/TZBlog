"use client";

import { useRef, useState } from "react";

export interface NotionMarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onSave?: () => void;
  mediaItems?: Array<{
    id: string;
    alt: string;
    url: string;
  }>;
}

const slashCommands = [
  { label: "段落", markdown: "段落" },
  { label: "二级标题", markdown: "## 标题" },
  { label: "无序列表", markdown: "- 列表项" },
  { label: "有序列表", markdown: "1. 列表项" },
  { label: "引用", markdown: "> 引用" },
  { label: "代码块", markdown: "```\n代码\n```" },
  { label: "图片", markdown: "![图片描述](url)", action: "image" },
  {
    label: "表格",
    markdown: "| 列 | 值 |\n| --- | --- |\n| 示例 | 内容 |",
  },
  { label: "提示块", markdown: "> [!NOTE]\n> 内容" },
];

export function NotionMarkdownEditor({
  value,
  onChange,
  onSave,
  mediaItems = [],
}: NotionMarkdownEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [selection, setSelection] = useState<{ from: number; to: number } | null>(
    null,
  );

  const insertCommand = (markdown: string) => {
    onChange(markdown);
    setMenuOpen(false);
    editorRef.current?.focus();
  };

  const handleCommand = (command: { label: string; markdown: string }) => {
    if ("action" in command && command.action === "image" && mediaItems.length > 0) {
      setMediaDialogOpen(true);
      setMenuOpen(false);
      return;
    }

    insertCommand(command.markdown);
  };

  const insertMedia = (item: { alt: string; url: string }) => {
    if (isUnsafeMediaUrl(item.url)) return;

    onChange(`![${item.alt}](${item.url})`);
    setMediaDialogOpen(false);
    editorRef.current?.focus();
  };

  const trackSelection = () => {
    const editor = editorRef.current;
    if (!editor || editor.selectionStart === editor.selectionEnd) {
      setSelection(null);
      return;
    }

    setSelection({ from: editor.selectionStart, to: editor.selectionEnd });
  };

  const formatSelection = (format: "bold" | "italic" | "code" | "link" | "h2") => {
    if (!selection) return;

    const selectedText = value.slice(selection.from, selection.to);
    const formatted =
      format === "bold"
        ? `**${selectedText}**`
        : format === "italic"
          ? `*${selectedText}*`
          : format === "code"
            ? `\`${selectedText}\``
            : format === "link"
              ? `[${selectedText}](url)`
              : `## ${selectedText}`;

    onChange(`${value.slice(0, selection.from)}${formatted}${value.slice(selection.to)}`);
    setSelection(null);
    editorRef.current?.focus();
  };

  return (
    <div className="relative">
      <textarea
        ref={editorRef}
        aria-label="文章内容"
        value={value}
        onSelect={trackSelection}
        onKeyUp={trackSelection}
        onMouseUp={trackSelection}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();
            onSave?.();
          }
        }}
        onChange={(event) => {
          const next = event.currentTarget.value;
          setMenuOpen(next.endsWith("/"));
          onChange(next);
        }}
      />

      {selection ? (
        <div
          role="toolbar"
          aria-label="文字格式"
          className="absolute -top-10 left-0 z-10 flex gap-1 rounded-md border border-border bg-bg p-1 shadow-soft"
        >
          {[
            { label: "加粗", format: "bold" },
            { label: "斜体", format: "italic" },
            { label: "行内代码", format: "code" },
            { label: "链接", format: "link" },
            { label: "二级标题", format: "h2" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className="rounded px-2 py-1 text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                formatSelection(
                  item.format as "bold" | "italic" | "code" | "link" | "h2",
                )
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {menuOpen ? (
        <div
          role="menu"
          aria-label="块命令"
          className="absolute z-10 mt-2 flex w-56 flex-col rounded-md border border-border bg-bg p-1 shadow-soft"
        >
          {slashCommands.map((command) => (
            <button
              key={command.label}
              type="button"
              role="menuitem"
              className="rounded px-2 py-1 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              onClick={() => handleCommand(command)}
            >
              {command.label}
            </button>
          ))}
        </div>
      ) : null}

      {mediaDialogOpen ? (
        <div
          role="dialog"
          aria-label="选择媒体"
          className="absolute z-20 mt-2 w-72 rounded-md border border-border bg-bg p-2 shadow-soft"
        >
          <div className="mb-2 text-xs font-medium text-muted-fg">选择媒体</div>
          <div className="flex flex-col gap-1">
            {mediaItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded px-2 py-1 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                onClick={() => insertMedia(item)}
              >
                {item.alt}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isUnsafeMediaUrl(url: string): boolean {
  return url.startsWith("blob:") || url.startsWith("data:");
}
