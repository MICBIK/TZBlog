"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorToolbar } from "./EditorToolbar";

export interface MarkdownSourceApi {
  getMarkdown: () => string;
  focus: () => void;
  setSelection: (from: number, to: number) => void;
  wrapSelection: (prefix: string, suffix: string) => void;
  prependToLine: (prefix: string) => void;
  insertSnippet: (snippet: string, selectFrom?: number, selectTo?: number) => void;
}

export interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onSave?: () => void;
  onReady?: (api: MarkdownSourceApi) => void;
  placeholder?: string;
  className?: string;
}

type SelectionRange = {
  from: number;
  to: number;
};

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  onReady,
  placeholder,
  className,
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef(value);
  const selectionRef = useRef<SelectionRange>({ from: value.length, to: value.length });
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const onReadyRef = useRef(onReady);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const emit = useCallback((next: string) => {
    textRef.current = next;
    onChangeRef.current(next);
  }, []);

  const api = useMemo<MarkdownSourceApi>(
    () => ({
      getMarkdown: () => textRef.current,
      focus: () => editorRef.current?.focus(),
      setSelection: (from, to) => {
        const docLength = textRef.current.length;
        selectionRef.current = {
          from: clampDocPosition(from, docLength),
          to: clampDocPosition(to, docLength),
        };
        editorRef.current?.focus();
      },
      wrapSelection: (prefix, suffix) => {
        const current = textRef.current;
        const selection = normalizeSelection(selectionRef.current, current.length);
        const selectedText = current.slice(selection.from, selection.to);
        const insert = `${prefix}${selectedText}${suffix}`;
        const next = replaceRange(current, selection, insert);
        const anchor = selection.from + prefix.length;
        const head = anchor + selectedText.length;

        selectionRef.current = { from: anchor, to: head };
        emit(next);
        editorRef.current?.focus();
      },
      prependToLine: (prefix) => {
        const current = textRef.current;
        const selection = normalizeSelection(selectionRef.current, current.length);
        const lineStart = current.lastIndexOf("\n", Math.max(0, selection.from - 1)) + 1;
        const next = `${current.slice(0, lineStart)}${prefix}${current.slice(lineStart)}`;

        selectionRef.current = {
          from: selection.from + prefix.length,
          to: selection.to + prefix.length,
        };
        emit(next);
        editorRef.current?.focus();
      },
      insertSnippet: (snippet, selectFrom = snippet.length, selectTo = selectFrom) => {
        const current = textRef.current;
        const selection = normalizeSelection(selectionRef.current, current.length);
        const next = replaceRange(current, selection, snippet);

        selectionRef.current = {
          from: selection.from + selectFrom,
          to: selection.from + selectTo,
        };
        emit(next);
        editorRef.current?.focus();
      },
    }),
    [emit],
  );

  useEffect(() => {
    onReadyRef.current?.(api);
  }, [api]);

  useEffect(() => {
    textRef.current = value;
    setSourceSelectionToEndIfNeeded(value, selectionRef);
  }, [value]);

  useEffect(() => {
    const syncThemeClass = () => {
      setDark(document.documentElement.classList.contains("dark"));
    };

    syncThemeClass();
    const themeObserver = new MutationObserver(syncThemeClass);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => themeObserver.disconnect();
  }, []);

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const next = event.currentTarget.textContent ?? "";
    textRef.current = next;
    onChangeRef.current(next);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      onSaveRef.current?.();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      insertAtSelection("  ");
      return;
    }

    if (event.key === "[") {
      event.preventDefault();
      insertAtSelection("[]", 1);
      return;
    }

    if (event.key === "Enter") {
      const continuation = getListContinuation(textRef.current, selectionRef.current.from);
      if (continuation) {
        event.preventDefault();
        insertAtSelection(`\n${continuation}`);
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const textFromClipboard = getPlainTextFromPaste(event);
    if (textFromClipboard === null) return;

    event.preventDefault();
    insertAtSelection(textFromClipboard);
  };

  const insertAtSelection = (insert: string, cursorOffset = insert.length) => {
    const current = textRef.current;
    const selection = normalizeSelection(selectionRef.current, current.length);
    const next = replaceRange(current, selection, insert);
    const cursor = selection.from + cursorOffset;

    selectionRef.current = { from: cursor, to: cursor };
    emit(next);
  };

  return (
    <div
      className={[
        "flex min-h-[24rem] flex-col overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg))]",
        className ?? "",
      ].join(" ")}
      data-editor="markdown-source"
    >
      <EditorToolbar source={api} />
      <div className={["cm-editor min-h-0 flex-1", dark ? "cm-editor-dark" : ""].join(" ")}>
        <div className="cm-scroller flex min-h-[24rem]">
          <div className="cm-gutters cm-lineNumbers w-12 shrink-0 select-none border-r border-[hsl(var(--border))] bg-[hsl(var(--bg))] px-2 py-3 text-right font-mono text-xs leading-6 text-[hsl(var(--muted-fg))]">
            {lineNumbers(value).map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
          <div className="relative min-w-0 flex-1">
            {value.length === 0 ? (
              <div className="cm-placeholder pointer-events-none absolute left-4 top-3 font-mono text-sm text-[hsl(var(--muted-fg))]">
                {placeholder ?? "在这里写 Markdown..."}
              </div>
            ) : null}
            <div
              ref={editorRef}
              role="textbox"
              aria-multiline="true"
              tabIndex={0}
              contentEditable
              suppressContentEditableWarning
              className="cm-content min-h-[24rem] whitespace-pre-wrap break-words px-4 py-3 font-mono text-base leading-relaxed text-[hsl(var(--fg))] outline-none focus:ring-2 focus:ring-inset focus:ring-[hsl(var(--ring))]"
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
            >
              {renderSourceLines(value)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function setSourceSelectionToEndIfNeeded(next: string, selectionRef: React.MutableRefObject<SelectionRange>) {
  const current = selectionRef.current;
  if (current.from === current.to && current.from === 0) {
    selectionRef.current = { from: next.length, to: next.length };
  }
}

function renderSourceLines(text: string) {
  if (text.length === 0) return null;

  return text.split("\n").map((line, index, lines) => {
    const content = index === lines.length - 1 ? line : `${line}\n`;
    if (/^#{1,6}\s/.test(line)) {
      return (
        <span key={`${index}-${line}`} className="cm-md-heading-line font-bold">
          {content}
        </span>
      );
    }
    return <span key={`${index}-${line}`}>{content}</span>;
  });
}

function lineNumbers(text: string): number[] {
  return Array.from({ length: Math.max(1, text.split("\n").length) }, (_, index) => index + 1);
}

function clampDocPosition(position: number, docLength: number): number {
  return Math.max(0, Math.min(position, docLength));
}

function normalizeSelection(selection: SelectionRange, docLength: number): SelectionRange {
  const from = clampDocPosition(selection.from, docLength);
  const to = clampDocPosition(selection.to, docLength);
  return from <= to ? { from, to } : { from: to, to: from };
}

function replaceRange(source: string, selection: SelectionRange, insert: string): string {
  return `${source.slice(0, selection.from)}${insert}${source.slice(selection.to)}`;
}

function getListContinuation(source: string, position: number): string | null {
  const lineStart = source.lastIndexOf("\n", Math.max(0, position - 1)) + 1;
  const line = source.slice(lineStart, position);
  const unordered = /^(\s*)[-*+]\s+/.exec(line);
  if (unordered) return `${unordered[1]}- `;

  const ordered = /^(\s*)(\d+)\.\s+/.exec(line);
  if (ordered) return `${ordered[1]}${Number(ordered[2]) + 1}. `;

  return null;
}

function getPlainTextFromPaste(event: React.ClipboardEvent<HTMLDivElement>): string | null {
  const plainText = event.clipboardData.getData("text/plain");
  if (plainText) return plainText;

  const html = event.clipboardData.getData("text/html");
  if (!html) return null;

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent ?? "";
  }

  return html.replace(/<[^>]*>/g, "");
}

export default MarkdownEditor;
