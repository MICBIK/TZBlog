"use client";

import * as React from "react";

import { MilkdownEditor } from "@/components/editor/MilkdownEditor";

const INITIAL_VALUE = [
  "# Editor Smoke",
  "",
  "这是一段用于移动端 overflow smoke 的长文本。",
  "",
  "- item 1",
  "- item 2",
  "- item 3",
  "",
  "> [!NOTE]",
  "> keep the editor inside the viewport",
].join("\n");

export default function EditorSmokePage() {
  const [value, setValue] = React.useState(INITIAL_VALUE);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-3 py-6">
      <MilkdownEditor value={value} onChange={setValue} />
    </main>
  );
}
