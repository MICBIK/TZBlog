"use client";

import * as React from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadMediaFile } from "@/lib/media-client";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export interface CoverUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function CoverUploader({ value, onChange }: CoverUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const openPicker = () => {
    if (isUploading) return;
    inputRef.current?.click();
  };

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUpload = async (file: File | null | undefined) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadMediaFile(file);
      onChange(url);
      toast.success("封面已上传");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setIsUploading(false);
      setIsDragging(false);
      resetInput();
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    void handleUpload(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => void handleUpload(event.target.files?.[0])}
      />

      <div
        role="button"
        tabIndex={isUploading ? -1 : 0}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-disabled={isUploading}
        className={cn(
          "group relative flex w-full flex-col overflow-hidden rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--bg))] text-left transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg))]",
          isUploading && "pointer-events-none opacity-70",
          isDragging && "border-[hsl(var(--accent))] bg-[hsl(var(--muted))]",
          value
            ? "min-h-[14rem] justify-end"
            : "items-center justify-center gap-3 px-4 py-8 hover:bg-[hsl(var(--muted))]",
        )}
      >
        {value ? (
          <>
            {/* 本地上传直接走 /public/uploads，按任务约束这里保留原生 <img>。 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="封面预览"
              className="aspect-[16/10] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 text-white">
              <div className="min-w-0">
                <p className="text-sm font-medium">点击或拖拽更换封面</p>
                <p className="truncate text-xs text-white/80">{value}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0"
                disabled={isUploading}
              >
                更换
              </Button>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-3 top-3 h-8 w-8"
              aria-label="清除封面"
              disabled={isUploading}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--fg))]" />
            ) : (
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--bg))] text-[hsl(var(--fg))]">
                <Upload className="h-5 w-5" />
              </div>
            )}
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-[hsl(var(--fg))]">
                {isUploading ? "上传中..." : "拖拽图片到这里，或点击上传"}
              </p>
              <p className="text-xs text-[hsl(var(--muted))]">
                支持 PNG、JPEG、WEBP、GIF，单文件 5MB 以内
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs text-[hsl(var(--muted))]">
              <ImagePlus className="h-4 w-4" />
              上传后会自动写入文章封面字段
            </span>
          </>
        )}

        {value && isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              上传中...
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CoverUploader;
