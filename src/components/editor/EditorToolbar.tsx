"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { MarkdownSourceApi } from "./MarkdownEditor";

interface EditorToolbarProps {
  source: MarkdownSourceApi | null;
}

interface ToolButtonProps {
  label: string;
  marker: string;
  disabled?: boolean;
  onClick: () => void;
}

const TOOLBAR_ITEMS = [
  { action: "bold", label: "加粗 Bold ⌘B", marker: "B" },
  { action: "italic", label: "斜体 Italic ⌘I", marker: "I" },
  { action: "code", label: "行内代码 Code ⌘E", marker: "`" },
  { action: "h2", label: "二级标题 H2 ⌘⌥2", marker: "H2" },
  { action: "h3", label: "三级标题 H3 ⌘⌥3", marker: "H3" },
  { action: "ul", label: "无序列表 UL ⌘⇧8", marker: "UL" },
  { action: "ol", label: "有序列表 OL ⌘⇧7", marker: "OL" },
  { action: "quote", label: "引用 Quote", marker: ">" },
  { action: "codeBlock", label: "代码块 Code Block", marker: "{}" },
  { action: "link", label: "链接 Link ⌘K", marker: "[]" },
  { action: "image", label: "图片 Image", marker: "IMG" },
  { action: "table", label: "表格 Table", marker: "TBL" },
  { action: "callout", label: "提示块 Callout NOTE", marker: "!" },
] as const;

type ToolbarAction = (typeof TOOLBAR_ITEMS)[number]["action"];

export function EditorToolbar({ source }: EditorToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const submitLink = () => {
    const url = linkUrl.trim();
    if (!source || !url) return;

    source.wrapSelection("[", `](${url})`);
    setLinkUrl("");
    setLinkDialogOpen(false);
  };

  return (
    <>
      <div
        role="toolbar"
        aria-label="Markdown source toolbar"
        className="flex flex-wrap items-center gap-1 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-2"
      >
        {TOOLBAR_ITEMS.map((item) => (
          <ToolButton
            key={item.label}
            label={item.label}
            marker={item.marker}
            disabled={!source}
            onClick={() => {
              if (item.action === "link") {
                setLinkDialogOpen(true);
                return;
              }

              runToolbarAction(source, item.action);
            }}
          />
        ))}
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>插入链接</DialogTitle>
            <DialogDescription>
              输入 URL 后会用 Markdown link 语法包裹当前选中文本。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label
              htmlFor="markdown-link-url"
              className="text-sm font-medium text-[hsl(var(--fg))]"
            >
              URL
            </label>
            <Input
              id="markdown-link-url"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLinkDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={submitLink}>
              插入链接 / Insert link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function runToolbarAction(source: MarkdownSourceApi | null, action: ToolbarAction) {
  if (!source) return;

  if (action === "bold") {
    source.wrapSelection("**", "**");
    return;
  }

  if (action === "h2") {
    source.prependToLine("## ");
    return;
  }

  if (action === "codeBlock") {
    source.wrapSelection("```\n", "\n```");
    return;
  }

  if (action === "callout") {
    const prefix = "> [!NOTE]\n> ";
    source.insertSnippet(`${prefix}内容`, prefix.length, prefix.length + "内容".length);
    return;
  }

  source.focus();
}

function ToolButton({ label, marker, disabled, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={[
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 font-mono text-xs transition-colors",
        "border-[hsl(var(--border))] bg-transparent text-[hsl(var(--fg))]",
        "hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--accent))]",
        "disabled:pointer-events-none disabled:opacity-50",
      ].join(" ")}
    >
      {marker}
    </button>
  );
}

export default EditorToolbar;
