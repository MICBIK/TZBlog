"use client";

import { useState } from "react";
import { MarkdownEditorWithPreview } from "@/components/editor/MarkdownEditorWithPreview";

const SAMPLE = `# Editor demo

Welcome to the **TZBlog** Markdown editor smoke-test page. Type below to see
the live preview update.

## Features

- Stored and edited as literal Markdown source
- CodeMirror 6 source editing with split preview
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
      <div className="rounded-md border border-warning bg-warning/10 px-4 py-3 font-mono text-xs uppercase tracking-label text-warning-fg">
        Editor PoC sandbox — not part of production
      </div>
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold text-[hsl(var(--fg))]">
          Markdown editor demo
        </h1>
        <span className="text-xs text-[hsl(var(--muted-fg))]">
          {value.length} chars
        </span>
      </header>
      <MarkdownEditorWithPreview value={value} onChange={setValue} />
    </main>
  );
}
