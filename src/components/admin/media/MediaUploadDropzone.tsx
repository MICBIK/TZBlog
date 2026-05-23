"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { uploadMediaFile } from "@/lib/media-client";
import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export function MediaUploadDropzone() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const openPicker = () => {
    if (isUploading) return;
    inputRef.current?.click();
  };

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const uploadFiles = async (input: FileList | File[] | null | undefined) => {
    const files = Array.from(input ?? []);
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    const failures: string[] = [];
    let successCount = 0;

    try {
      for (const file of files) {
        try {
          await uploadMediaFile(file);
          successCount += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : "上传失败";
          failures.push(`${file.name}: ${message}`);
        }
      }

      if (successCount > 0) {
        toast.success(`已上传 ${successCount} 个文件`);
        router.refresh();
      }

      if (failures.length > 0) {
        toast.error(`${failures.length} 个文件上传失败：${failures.join("；")}`);
      }
    } finally {
      setIsUploading(false);
      setIsDragging(false);
      resetInput();
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    void uploadFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => void uploadFiles(event.target.files)}
      />
      <div
        role="button"
        tabIndex={isUploading ? -1 : 0}
        data-testid="media-upload-dropzone"
        aria-label="上传媒体文件"
        aria-disabled={isUploading}
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
        className={cn(
          "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-bg px-6 py-8 text-center transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "hover:bg-muted",
          isDragging && "border-accent bg-muted",
          isUploading && "pointer-events-none cursor-not-allowed opacity-70",
        )}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-fg" />
        ) : (
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg text-fg">
            <Upload className="h-5 w-5" />
          </div>
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium text-fg">
            {isUploading ? "上传中..." : "拖拽图片到这里，或点击上传"}
          </p>
          <p className="text-xs text-muted-fg">
            支持 PNG、JPEG、WEBP、GIF，可一次选择多个文件，单文件 5MB 以内
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-muted-fg">
          <ImagePlus className="h-4 w-4" />
          上传后会自动刷新媒体库
        </span>
      </div>
    </div>
  );
}

export default MediaUploadDropzone;
