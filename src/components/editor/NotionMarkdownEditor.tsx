"use client";

export interface NotionMarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
}

export function NotionMarkdownEditor({
  value,
  onChange,
}: NotionMarkdownEditorProps) {
  return (
    <textarea
      aria-label="文章内容"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}
