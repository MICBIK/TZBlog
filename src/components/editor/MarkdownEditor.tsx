"use client";

import { useEffect, useRef, useState } from "react";
import { basicSetup } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { indentUnit } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, placeholder as cmPlaceholder } from "@codemirror/view";
import { EditorToolbar } from "./EditorToolbar";

export interface MarkdownSourceApi {
  getMarkdown: () => string;
  focus: () => void;
  setSelection: (from: number, to: number) => void;
  wrapSelection: (prefix: string, suffix: string) => void;
  prependToLine: (prefix: string) => void;
}

export interface MarkdownEditorProps {
  /** Current Markdown value (controlled). */
  value: string;
  /** Fired with the latest Markdown after each edit. */
  onChange: (markdown: string) => void;
  /** Exposes the literal source document for toolbar and round-trip checks. */
  onReady?: (api: MarkdownSourceApi) => void;
  /** Placeholder shown when the document is empty. */
  placeholder?: string;
  /** Optional extra className on the outer wrapper. */
  className?: string;
}

/**
 * CodeMirror-backed source editor.
 *
 * The contract is intentionally literal: `value` is Markdown text, the editor
 * displays Markdown text, and `onChange` emits Markdown text without
 * serializing through rich-text state.
 */
export function MarkdownEditor({
  value,
  onChange,
  onReady,
  placeholder,
  className,
}: MarkdownEditorProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const applyingExternalChangeRef = useRef(false);
  const [sourceApi, setSourceApi] = useState<MarkdownSourceApi | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (!mountRef.current || viewRef.current) return;

    const view = new EditorView({
      parent: mountRef.current,
      state: EditorState.create({
        doc: valueRef.current,
        extensions: [
          basicSetup,
          markdown(),
          indentUnit.of("  "),
          cmPlaceholder(placeholder ?? "在这里写 Markdown..."),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;

            const next = update.state.doc.toString();
            valueRef.current = next;
            if (applyingExternalChangeRef.current) return;
            onChangeRef.current(next);
          }),
          EditorView.theme({
            "&": {
              backgroundColor: "hsl(var(--bg))",
              color: "hsl(var(--fg))",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-base)",
              minHeight: "24rem",
            },
            ".cm-scroller": {
              fontFamily: "var(--font-mono)",
              lineHeight: "1.65",
            },
            ".cm-content": {
              minHeight: "24rem",
              padding: "0.875rem 1rem",
            },
            ".cm-gutters": {
              backgroundColor: "hsl(var(--bg))",
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--muted-fg))",
            },
            "&.cm-focused": {
              outline: "2px solid hsl(var(--ring))",
              outlineOffset: "-2px",
            },
          }),
        ],
      }),
    });

    viewRef.current = view;
    const api: MarkdownSourceApi = {
      getMarkdown: () => view.state.doc.toString(),
      focus: () => view.focus(),
      setSelection: (from, to) => {
        const docLength = view.state.doc.length;
        view.dispatch({
          selection: {
            anchor: clampDocPosition(from, docLength),
            head: clampDocPosition(to, docLength),
          },
          scrollIntoView: true,
        });
      },
      wrapSelection: (prefix, suffix) => {
        const selection = view.state.selection.main;
        const selectedText = view.state.doc.sliceString(selection.from, selection.to);
        const insert = `${prefix}${selectedText}${suffix}`;
        const anchor = selection.from + prefix.length;
        const head = anchor + selectedText.length;

        view.dispatch({
          changes: {
            from: selection.from,
            to: selection.to,
            insert,
          },
          selection: { anchor, head },
          scrollIntoView: true,
        });
        view.focus();
      },
      prependToLine: (prefix) => {
        const selection = view.state.selection.main;
        const line = view.state.doc.lineAt(selection.from);

        view.dispatch({
          changes: { from: line.from, insert: prefix },
          selection: {
            anchor: selection.anchor + prefix.length,
            head: selection.head + prefix.length,
          },
          scrollIntoView: true,
        });
        view.focus();
      },
    };
    setSourceApi(api);
    onReadyRef.current?.(api);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [placeholder]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();
    if (value === current) return;

    valueRef.current = value;
    applyingExternalChangeRef.current = true;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
    applyingExternalChangeRef.current = false;
  }, [value]);

  return (
    <div
      className={[
        "flex min-h-[24rem] flex-col overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg))]",
        className ?? "",
      ].join(" ")}
      data-editor="markdown-source"
    >
      <EditorToolbar source={sourceApi} />
      <div ref={mountRef} className="min-h-0 flex-1" />
    </div>
  );
}

function clampDocPosition(position: number, docLength: number): number {
  return Math.max(0, Math.min(position, docLength));
}

export default MarkdownEditor;
