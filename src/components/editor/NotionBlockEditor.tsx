"use client";

import * as React from "react";
import { ImagePlus, X } from "lucide-react";

import {
  isSafeMediaUrl,
  parseMarkdownToEditorBlocks,
  serializeEditorBlocksToMarkdown,
  type EditorBlock,
} from "./markdownBridge";

export interface NotionBlockEditorMediaItem {
  id: string;
  alt: string;
  url: string;
}

export interface NotionBlockEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onSave?: () => void;
  mediaItems?: NotionBlockEditorMediaItem[];
  theme?: "light" | "dark";
  onEditorReady?: (editor: LegacyEditorHarness) => void;
}

export interface LegacyEditorHarness {
  document: EditorBlock[];
  replaceBlocks: (remove: unknown[], insert: unknown[]) => void;
  insertBlocks: (blocks: unknown[], reference: unknown, placement?: string) => void;
}

const CHANGE_DEBOUNCE_MS = 300;

export function NotionBlockEditor({
  value,
  onChange,
  onSave,
  mediaItems = [],
  theme = "light",
  onEditorReady,
}: NotionBlockEditorProps) {
  const [draft, setDraft] = React.useState(value);
  const [mediaDialogOpen, setMediaDialogOpen] = React.useState(false);
  const draftRef = React.useRef(value);
  const blocksRef = React.useRef<EditorBlock[]>([{ id: "source", type: "source", source: value }]);
  const onChangeRef = React.useRef(onChange);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    draftRef.current = value;
    queueMicrotask(() => setDraft(value));
    void parseMarkdownToEditorBlocks(value).then((blocks) => {
      blocksRef.current = blocks;
    });
  }, [value]);

  const emitDebounced = React.useCallback((next: string) => {
    draftRef.current = next;
    setDraft(next);
    blocksRef.current = [{ id: "source", type: "source", source: next }];
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChangeRef.current(draftRef.current);
    }, CHANGE_DEBOUNCE_MS);
  }, []);

  const harness = React.useMemo<LegacyEditorHarness>(
    () => ({
      get document() {
        return blocksRef.current;
      },
      replaceBlocks: (_remove, insert) => {
        const blocks = normalizeHarnessBlocks(insert);
        blocksRef.current = blocks.length > 0 ? blocks : [{ id: "source", type: "source", source: "" }];
        void serializeEditorBlocksToMarkdown(blocksRef.current).then(emitDebounced);
      },
      insertBlocks: (blocks) => {
        const insertBlocks = normalizeHarnessBlocks(blocks);
        const current = draftRef.current;
        const insert = insertBlocks.map(blockToMarkdown).filter(Boolean).join("\n\n");
        const next = current.trim() ? `${current}\n\n${insert}` : insert;
        blocksRef.current = [...blocksRef.current, ...insertBlocks];
        emitDebounced(next);
      },
    }),
    [emitDebounced],
  );

  React.useEffect(() => {
    onEditorReady?.(harness);
  }, [harness, onEditorReady]);

  React.useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        onSave?.();
      }
    },
    [onSave],
  );

  const insertMedia = (item: NotionBlockEditorMediaItem) => {
    if (!isSafeMediaUrl(item.url)) {
      setMediaDialogOpen(false);
      return;
    }

    const imageMarkdown = `![${item.alt}](${item.url})`;
    const next = draftRef.current.trim()
      ? `${draftRef.current}\n\n${imageMarkdown}`
      : imageMarkdown;
    emitDebounced(next);
    setMediaDialogOpen(false);
  };

  return (
    <div
      data-notion-block-editor
      data-theme={theme}
      onKeyDown={handleKeyDown}
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/80 px-3 py-2 text-xs text-muted-fg">
        <div className="flex items-center gap-2">
          {mediaItems.length > 0 && (
            <button
              type="button"
              aria-label="插入媒体"
              onClick={() => setMediaDialogOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-bg px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition hover:bg-muted hover:text-fg"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              媒体
            </button>
          )}
        </div>
        <span className="font-mono">⌘S 保存</span>
      </div>

      <textarea
        aria-label="Markdown editor content"
        value={draft}
        onChange={(event) => emitDebounced(event.target.value)}
        className="min-h-[32rem] w-full resize-y bg-bg px-4 py-4 font-mono text-sm leading-7 text-fg outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
      />

      {mediaDialogOpen ? (
        <div
          role="dialog"
          aria-label="选择媒体"
          className="absolute right-3 top-12 z-20 w-72 rounded-2xl border border-border bg-bg/95 p-2 shadow-md backdrop-blur"
        >
          <div className="flex items-center justify-between border-b border-border/80 px-2 pb-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-fg">
              选择媒体
            </span>
            <button
              type="button"
              aria-label="关闭媒体面板"
              onClick={() => setMediaDialogOpen(false)}
              className="rounded p-1 text-muted-fg hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-1 pt-2">
            {mediaItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => insertMedia(item)}
                className="rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
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

function normalizeHarnessBlocks(input: unknown[]): EditorBlock[] {
  return input
    .filter((block): block is Record<string, unknown> => typeof block === "object" && block !== null)
    .map((block, index) => ({
      id: typeof block.id === "string" ? block.id : `block-${index}`,
      type: typeof block.type === "string" ? block.type : "paragraph",
      props:
        typeof block.props === "object" && block.props !== null
          ? (block.props as Record<string, unknown>)
          : undefined,
      content: block.content,
      source: typeof block.source === "string" ? block.source : undefined,
    }));
}

function blockToMarkdown(block: EditorBlock): string {
  if (typeof block.source === "string") return block.source;
  if (block.type === "heading") {
    const level = typeof block.props?.level === "number" ? block.props.level : 2;
    return `${"#".repeat(level)} ${readText(block)}`;
  }
  if (block.type === "image") {
    const src = typeof block.props?.url === "string" ? block.props.url : "";
    const alt = typeof block.props?.caption === "string" ? block.props.caption : "";
    return src ? `![${alt}](${src})` : "";
  }
  return readText(block);
}

function readText(block: EditorBlock): string {
  if (typeof block.content === "string") return block.content;
  if (Array.isArray(block.content)) {
    return block.content
      .map((part) =>
        typeof part === "object" &&
        part !== null &&
        "text" in part &&
        typeof part.text === "string"
          ? part.text
          : "",
      )
      .join("");
  }
  return "";
}
