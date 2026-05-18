"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Markdown } from "tiptap-markdown";
import { createLowlight, common } from "lowlight";
import { EditorToolbar } from "./EditorToolbar";

const lowlight = createLowlight(common);

/**
 * `tiptap-markdown` augments `editor.storage` at runtime with a `markdown`
 * key, but the upstream Tiptap typings don't reflect it. This narrow accessor
 * isolates the cast so the rest of the codebase can stay strict.
 */
function getEditorMarkdown(editor: Editor): string {
  const storage = editor.storage as unknown as {
    markdown?: { getMarkdown?: () => string };
  };
  return storage.markdown?.getMarkdown?.() ?? "";
}

export interface MarkdownEditorProps {
  /** Current Markdown value (controlled). */
  value: string;
  /** Fired with the latest Markdown after each edit. */
  onChange: (markdown: string) => void;
  /** Placeholder shown when the document is empty. (Visual only — Tiptap supplies this via Placeholder extension; we keep it here as a hint passthrough.) */
  placeholder?: string;
  /** Optional extra className on the outer wrapper. */
  className?: string;
}

/**
 * Tiptap WYSIWYG editor that exposes/consumes Markdown (per systemPatterns §14).
 *
 * Internal ProseMirror state holds JSON, but the contract with the rest of the
 * app is Markdown — `onChange` always emits Markdown, and `value` always feeds
 * Markdown back in. `tiptap-markdown` does the round-trip serialization.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
}: MarkdownEditorProps) {
  const editor = useEditor({
    // Avoid SSR mismatches; ProseMirror needs the DOM.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // CodeBlockLowlight replaces the built-in CodeBlock node.
        codeBlock: false,
      }),
      Link.configure({
        autolink: true,
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image,
      CodeBlockLowlight.configure({ lowlight }),
      Markdown.configure({
        html: false,
        linkify: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: [
          "ProseMirror",
          "prose prose-neutral dark:prose-invert max-w-none",
          "min-h-[24rem] px-4 py-3 focus:outline-none",
        ].join(" "),
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(getEditorMarkdown(editor));
    },
  });

  // Keep editor content in sync when `value` is changed externally
  // (e.g. parent loads a draft from the server). Avoid feedback loops by
  // only re-setting when the markdown round-trip differs.
  useEffect(() => {
    if (!editor) return;
    const current = getEditorMarkdown(editor);
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- editor identity is stable
  }, [value, editor]);

  return (
    <div
      className={[
        "flex flex-col rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg))]",
        className ?? "",
      ].join(" ")}
    >
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default MarkdownEditor;
