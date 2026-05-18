"use client";

import { useState } from "react";
import { MarkdownEditorWithPreview } from "@/components/editor/MarkdownEditorWithPreview";

const SAMPLE = `# Editor demo

Welcome to the **TZBlog** Markdown editor smoke-test page. Type below to see
the live preview update.

## Features

- WYSIWYG editing via Tiptap
- Stored as plain Markdown (per systemPatterns §14)
- GFM-flavoured: tables, task lists, strikethrough

## Code

\`\`\`ts
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

> Tip: switch to the **Preview** tab on mobile.
`;

export default function EditorDemoPage() {
  const [value, setValue] = useState(SAMPLE);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold text-[hsl(var(--fg))]">
          Markdown editor demo
        </h1>
        <span className="text-xs text-[hsl(var(--muted))]">
          {value.length} chars
        </span>
      </header>
      <MarkdownEditorWithPreview value={value} onChange={setValue} />
    </main>
  );
}
