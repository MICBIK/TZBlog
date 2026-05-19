"use client";

import * as React from "react";
import type { Media } from "@prisma/client";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { MediaRowActions } from "./MediaRowActions";

export interface MediaCardProps {
  media: Media;
}

export function MediaCard({ media }: MediaCardProps) {
  const [isDeleted, setIsDeleted] = React.useState(false);

  if (isDeleted) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await copyText(media.url);
      toast.success("URL 已复制");
    } catch {
      toast.error("复制失败，请手动复制该 URL");
    }
  };

  return (
    <article className="group overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg))]">
      <div className="relative aspect-square overflow-hidden bg-[hsl(var(--muted))]">
        {/* 本地上传文件直接由 /public/uploads 提供，按任务约束这里保留原生 <img>。 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.url}
          alt={media.filename}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
        <div className="absolute right-3 top-3 flex items-center gap-2 opacity-100 transition-all sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-sm"
            aria-label="复制 URL"
            onClick={() => void handleCopy()}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <MediaRowActions
            mediaId={media.id}
            onDeleted={() => setIsDeleted(true)}
          />
        </div>
      </div>

      <div className="space-y-2 p-3">
        <p className="truncate text-sm font-medium text-[hsl(var(--fg))]">
          {media.filename}
        </p>
        <div className="flex items-center justify-between gap-3 text-xs text-[hsl(var(--muted))]">
          <span>{formatDimensions(media)}</span>
          <span>{formatBytes(media.size)}</span>
        </div>
      </div>
    </article>
  );
}

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!copied) {
      throw new Error("复制失败");
    }
  }
}

function formatDimensions(media: Media): string {
  if (typeof media.width !== "number" || typeof media.height !== "number") {
    return "尺寸未知";
  }

  return `${media.width} × ${media.height}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${trimDecimal(bytes / 1024)} KB`;
  }

  return `${trimDecimal(bytes / (1024 * 1024))} MB`;
}

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

export default MediaCard;
