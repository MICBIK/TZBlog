"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import { ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { uploadMediaFile } from "@/lib/media-client";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export interface ImageUploadButtonProps {
  editor: Editor | null;
}

export function ImageUploadButton({ editor }: ImageUploadButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
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

  const handleUpload = async (file: File | null | undefined) => {
    if (!file || !editor) return;

    setIsUploading(true);
    try {
      const url = await uploadMediaFile(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setIsUploading(false);
      resetInput();
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => void handleUpload(event.target.files?.[0])}
      />
      <button
        type="button"
        aria-label="上传图片"
        title="上传图片"
        disabled={!editor || isUploading}
        onMouseDown={(event) => event.preventDefault()}
        onClick={openPicker}
        className={[
          "inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors",
          "border-[hsl(var(--border))] bg-transparent text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))]",
          "disabled:pointer-events-none disabled:opacity-50",
        ].join(" ")}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageUp size={16} />
        )}
      </button>
    </>
  );
}

export default ImageUploadButton;
