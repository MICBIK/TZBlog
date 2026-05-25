"use client";

import * as React from "react";

export interface MilkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onSave?: () => void;
  theme?: "light" | "dark";
}

export function MilkdownEditor({
  value,
  onChange,
  theme = "light",
}: MilkdownEditorProps) {
  const [draft, setDraft] = React.useState(value);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setDraft(next);
    onChange(next);
  };

  const showSlashMenu = draft.endsWith("/");

  return (
    <div
      data-milkdown-editor
      data-theme={theme}
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <textarea
        aria-label="Milkdown editor content"
        value={draft}
        onChange={handleChange}
        className="min-h-[20rem] w-full resize-y bg-bg px-4 py-4 font-mono text-sm leading-7 text-fg outline-none"
      />

      {showSlashMenu ? (
        <div
          role="menu"
          aria-label="Slash 菜单"
          className="absolute left-4 top-16 rounded-xl border border-border bg-bg shadow-md"
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
    </div>
  );
}

export default MilkdownEditor;
