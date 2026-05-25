"use client";

import * as React from "react";
import { isSafeMediaUrl } from "./milkdownBridge";

export interface MilkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onSave?: () => void;
  theme?: "light" | "dark";
}

export function MilkdownEditor({
  value,
  onChange,
  onSave,
  theme = "light",
}: MilkdownEditorProps) {
  const [draft, setDraft] = React.useState(value);
  const [hasSelection, setHasSelection] = React.useState(false);
  const onChangeRef = React.useRef(onChange);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    },
    [],
  );

  const emitChange = (next: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChangeRef.current(next);
    }, 300);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setDraft(next);
    emitChange(next);
  };

  const handleSelect = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    setHasSelection(target.selectionStart !== target.selectionEnd);
  };

  const handleDrop = async (event: React.DragEvent<HTMLTextAreaElement>) => {
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    event.preventDefault();
    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/media/upload", {
      method: "POST",
      body,
    });

    if (!response.ok) return;

    const payload = (await response.json()) as {
      data?: {
        url?: string;
        alt?: string;
      };
    };
    const url = payload.data?.url;
    const alt = payload.data?.alt ?? file.name;
    if (!url || !isSafeMediaUrl(url)) return;

    const next = `![${alt}](${url})`;
    setDraft(next);
    emitChange(next);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      onSave?.();
    }
  };

  const showSlashMenu = draft.endsWith("/");

  return (
    <div
      data-milkdown-editor
      data-theme={theme}
      data-reduced-motion-safe
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <textarea
        aria-label="Milkdown editor content"
        value={draft}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onDrop={(event) => {
          void handleDrop(event);
        }}
        className="min-h-[20rem] w-full resize-y bg-bg px-4 py-4 font-mono text-sm leading-7 text-fg outline-none"
      />

      {showSlashMenu ? (
        <div
          role="menu"
          aria-label="Slash 菜单"
          className="absolute left-4 top-16 rounded-xl border border-border bg-bg shadow-md transition-none motion-reduce:transition-none"
        >
          <button
            type="button"
            role="menuitem"
            className="block px-3 py-2 text-sm text-fg"
          >
            二级标题
          </button>
        </div>
      ) : null}

      {hasSelection ? (
        <div
          role="toolbar"
          aria-label="Bubble 菜单"
          className="absolute right-4 top-4 rounded-xl border border-border bg-bg shadow-md transition-none motion-reduce:transition-none"
        >
          <button
            type="button"
            className="block px-3 py-2 text-sm text-fg"
          >
            Bold
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default MilkdownEditor;
